const express = require('express');
require('dotenv').config();
const path = require('path');
const cors = require("cors");
const fs = require('fs');
const rateLimit = require('express-rate-limit');
const dbService = require('./services/db.service');
const distanceService = require('./services/distance.service');
const addressService = require('./services/address.service');
const cacheService = require('./services/cache.service');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});

const staticDir = path.resolve(__dirname, "../client/build");
app.use(express.static(staticDir));
console.log(`Serving static files from: ${staticDir}`);

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
});

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    dbService.close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

dbService.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
  });

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Welcome to the Distance Calculator API', 
    status: 'online',
    mongodb: dbService.isConnected() ? 'connected' : 'not connected yet',
    serverTime: new Date().toISOString()
  });
});

app.get('/distance', apiLimiter, async (req, res) => {
  try {
    let { address1, address2 } = req.query;
    
    if (!address1 || !address2) {
      return res.status(400).json({ 
        error: 'Missing parameters', 
        message: 'Both address1 and address2 parameters are required' 
      });
    }
    
    const originalAddress1 = address1;
    const originalAddress2 = address2;
    
    address1 = addressService.processAddress(address1);
    address2 = addressService.processAddress(address2);
    
    if (address1 !== originalAddress1 || address2 !== originalAddress2) {
      console.log('Address processing applied:');
      console.log(`Address 1: "${originalAddress1}" → "${address1}"`);
      console.log(`Address 2: "${originalAddress2}" → "${address2}"`);
    }
    
    // Check MongoDB cache first
    let result;
    let fromCache = false;
    
    if (dbService.isConnected()) {
      const cachedResult = await cacheService.get(address1, address2);
      if (cachedResult) {
        result = cachedResult;
        fromCache = true;
        console.log('Using cached result for', address1, address2);
      }
    }
    
    // If not in cache, calculate the distance
    if (!result) {
      console.log('Calculating distance for', address1, address2);
      result = distanceService.getDistanceBetween(address1, address2);
      
      // Save to MongoDB cache
      if (dbService.isConnected()) {
        await cacheService.set(address1, address2, result);
      }
    }
    
    // Add metadata to the result
    result.originalAddresses = {
      address1: originalAddress1,
      address2: originalAddress2
    };
    
    result.fromCache = fromCache;
    
    // Record query in history (even if from cache)
    if (dbService.isConnected()) {
      try {
        await dbService.getDb().collection('distances').insertOne({
          ...result,
          timestamp: new Date()
        });
        result.saved = true;
      } catch (dbError) {
        console.error('Error saving to database:', dbError.message);
        result.saved = false;
        result.dbError = dbError.message;
      }
    } else {
      result.saved = false;
      result.dbStatus = 'No database connection';
      console.warn('Distance calculated but not saved (no DB connection)');
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({ 
      error: 'Failed to calculate distance',
      message: error.message 
    });
  }
});

app.get('/history', apiLimiter, async (req, res) => {
  try {
    if (!dbService.isConnected()) {
      return res.status(503).json({ 
        error: 'Database connection not available',
        message: 'The server is running without a connection to MongoDB'
      });
    }
    
    const filter = {};
    const limit = parseInt(req.query.limit) || 10;
    
    const history = await dbService.getDb().collection('distances')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    res.json({
      count: history.length,
      results: history
    });
    
  } catch (error) {
    console.error('Error fetching distance history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch distance history',
      message: error.message 
    });
  }
});

app.get('/api/db-status', (req, res) => {
  res.json({
    status: dbService.isConnected() ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

const fallbackHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Distance Calculator API</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    .card { background: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
    .endpoint { background: #eef; padding: 10px; border-radius: 5px; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Distance Calculator API</h1>
    <div class="card">
      <h2>API is running!</h2>
      <p>Server time: ${new Date().toISOString()}</p>
      <p>This is a fallback page. The actual frontend could not be found.</p>
    </div>
    <div class="card">
      <h2>Available Endpoints:</h2>
      <div class="endpoint">/distance?address1=New York&address2=Boston</div>
      <div class="endpoint">/history</div>
      <div class="endpoint">/api/db-status</div>
    </div>
  </div>
</body>
</html>
`;

app.get("*", function (req, res) {
  const indexPath = path.resolve(__dirname, "../client/build/index.html");
  
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  } else {
    console.error(`Could not find index.html at ${indexPath}`);
    res.send(fallbackHtml);
  }
});

module.exports = app;

const dbService = require('./db.service');

const cacheService = {
  async get(address1, address2) {
    if (!dbService.isConnected()) {
      return null;
    }
    
    try {
      const addresses = [address1, address2].sort();
      const key = `${addresses[0]}|${addresses[1]}`;
      
      const cachedItem = await dbService.getDb()
        .collection('distance_cache')
        .findOne({ key });
      
      if (cachedItem) {
        const cacheAge = Date.now() - new Date(cachedItem.lastUpdated).getTime();
        if (cacheAge < 30 * 24 * 60 * 60 * 1000) { // 30 days in milliseconds
          console.log('Cache hit for addresses:', address1, address2);
          return cachedItem.data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error retrieving from cache:', error);
      return null;
    }
  },
  
  async set(address1, address2, data) {
    if (!dbService.isConnected()) {
      return;
    }
    
    try {
      const addresses = [address1, address2].sort();
      const key = `${addresses[0]}|${addresses[1]}`;
      
      await dbService.getDb()
        .collection('distance_cache')
        .updateOne(
          { key },
          {
            $set: {
              key,
              data,
              address1,
              address2,
              lastUpdated: new Date()
            }
          },
          { upsert: true }
        );
        
      console.log('Cache updated for addresses:', address1, address2);
    } catch (error) {
      console.error('Error updating cache:', error);
    }
  }
};

module.exports = cacheService;

const { MongoClient } = require('mongodb');

class DatabaseService {
 constructor() {
   this.client = null;
   this.db = null;
   
   this.maxRetries = 3;
   this.initialRetryDelay = 1000;
 }

 async withRetry(operation, operationName, retryCount = 0) {
   try {
     return await operation();
   } catch (error) {
     if (retryCount >= this.maxRetries) {
       console.error(`[${operationName}] Max retries (${this.maxRetries}) exceeded.`);
       throw error;
     }

     const delay = this.initialRetryDelay * Math.pow(2, retryCount);
     console.log(`[${operationName}] Retry attempt ${retryCount + 1}/${this.maxRetries} after ${delay}ms delay. Error: ${error.message}`);
     
     await new Promise(resolve => setTimeout(resolve, delay));
     
     return this.withRetry(operation, operationName, retryCount + 1);
   }
 }

 async connect(uri) {
   if (!uri) {
     console.log('No MongoDB URI provided, skipping connection');
     return false;
   }

   return this.withRetry(async () => {
     console.log('Attempting to connect to MongoDB...');
     const uriPreview = uri.substring(0, uri.indexOf('@') > 0 ? 
                         uri.indexOf('@') : 15) + '...';
     console.log(`Connecting with URI starting with: ${uriPreview}`);
     
     this.client = new MongoClient(uri, {
       connectTimeoutMS: 30000,
       socketTimeoutMS: 45000,
       serverSelectionTimeoutMS: 60000,
     });
     
     await this.client.connect();
     console.log('Connected to MongoDB successfully');
     
     let dbName = 'distance_calculator';
     try {
       const uriParts = uri.split('/');
       if (uriParts.length > 3) {
         const dbPart = uriParts[3].split('?')[0];
         if (dbPart && dbPart.length > 0) {
           dbName = dbPart;
         }
       }
     } catch (e) {
       console.warn('Could not parse database name from URI, using default');
     }
     
     console.log(`Using database: ${dbName}`);
     this.db = this.client.db(dbName);
     
     const collections = await this.withRetry(
       () => this.db.listCollections().toArray(),
       'listCollections'
     );
     console.log(`Connected to ${collections.length} collections`);
     
     await this.setupGeocodingCache();
     
     return true;
   }, 'connect');
 }

 async setupGeocodingCache() {
   if (!this.db) return false;
   
   return this.withRetry(async () => {
     const collections = await this.db.listCollections({ name: 'geocoding_cache' }).toArray();
     if (collections.length === 0) {
       console.log('Creating geocoding_cache collection');
       await this.db.createCollection('geocoding_cache');
     }
     
     await this.db.collection('geocoding_cache').createIndex(
       { address: 1 }, 
       { unique: true }
     );
     
     console.log('Geocoding cache setup complete');
     return true;
   }, 'setupGeocodingCache');
 }

 async close() {
   if (this.client) {
     return this.withRetry(async () => {
       await this.client.close();
       this.client = null;
       this.db = null;
       console.log('MongoDB connection closed');
       return true;
     }, 'close');
   }
   return true;
 }

 getDb() {
   if (this.db && this.client) {
     try {
       const isConnected = this.client.topology && this.client.topology.isConnected();
       if (!isConnected) {
         console.warn('MongoDB connection appears to be disconnected');
         return null;
       }
       return this.db;
     } catch (error) {
       console.error('Error checking MongoDB connection status:', error.message);
       return null;
     }
   }
   return null;
 }

 isConnected() {
   if (!this.client || !this.db) return false;
   
   try {
     return this.client.topology && this.client.topology.isConnected();
   } catch (error) {
     console.error('Error checking connection status:', error.message);
     return false;
   }
 }

 async reconnect(uri) {
   if (!uri) {
     console.error('Cannot reconnect: No MongoDB URI provided');
     return false;
   }

   console.log('Attempting to reconnect to MongoDB...');
   
   if (this.client) {
     try {
       await this.close();
     } catch (error) {
       console.warn('Error closing existing connection during reconnect:', error.message);
     }
   }

   return this.connect(uri);
 }
}

module.exports = new DatabaseService();

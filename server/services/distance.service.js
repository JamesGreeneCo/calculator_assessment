const axios = require('axios');

class DistanceService {
  constructor() {
    this.userAgent = 'DistanceCalculatorAPI/1.0';
    this.delayBetweenRequests = 1000;
  }

  async getCoordinates(address) {
    try {
      console.log(`Geocoding address: "${address}"`);
      
      const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: address,
          format: 'json',
          limit: 1
        },
        headers: {
          'User-Agent': this.userAgent
        }
      });
      
      if (response.data.length === 0) {
        throw new Error(`No coordinates found for address: ${address}`);
      }
      
      const { lat, lon, display_name } = response.data[0];
      return { 
        lat: parseFloat(lat), 
        lon: parseFloat(lon), 
        display_name 
      };
      
    } catch (error) {
      console.error(`Error getting coordinates for ${address}:`, error.message);
      throw error;
    }
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371.0088; // Earth's mean radius in kilometers
    
    const lat1Rad = this._toRadians(lat1);
    const lon1Rad = this._toRadians(lon1);
    const lat2Rad = this._toRadians(lat2);
    const lon2Rad = this._toRadians(lon2);
    
    const deltaLat = this._toRadians(lat2 - lat1);
    const deltaLon = this._toRadians(lon2 - lon1);
    
    const a = Math.pow(Math.sin(deltaLat / 2), 2) + 
              Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
              Math.pow(Math.sin(deltaLon / 2), 2);
    
    const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
    
    return R * c;
  }


  _toRadians(degree) {
    return degree * Math.PI / 180.0;
  }

  async getDistanceBetween(address1, address2) {
    try {
      const coords1 = await this.getCoordinates(address1);
      
      await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
      
      const coords2 = await this.getCoordinates(address2);
      
      console.log(`Coordinates for "${address1}": lat=${coords1.lat}, lon=${coords1.lon}`);
      console.log(`Coordinates for "${address2}": lat=${coords2.lat}, lon=${coords2.lon}`);
      
      const distanceKm = this.calculateDistance(
        coords1.lat, coords1.lon,
        coords2.lat, coords2.lon
      );
      
      const distanceMiles = distanceKm * 0.621371192;
      
      console.log(`Calculated distance: ${distanceKm.toFixed(2)} km (${distanceMiles.toFixed(2)} miles)`);
      
      return {
        miles: parseFloat(distanceMiles.toFixed(2)),
        kilometers: parseFloat(distanceKm.toFixed(2)),
        distance: {
          kilometers: parseFloat(distanceKm.toFixed(2)),
          miles: parseFloat(distanceMiles.toFixed(2))
        },
        locations: {
          origin: {
            address: address1,
            formatted_address: coords1.display_name,
            coordinates: {
              lat: coords1.lat,
              lon: coords1.lon
            }
          },
          destination: {
            address: address2,
            formatted_address: coords2.display_name,
            coordinates: {
              lat: coords2.lat,
              lon: coords2.lon
            }
          }
        },
        metadata: {
          calculation_time: new Date().toISOString(),
          api_version: '1.0',
          calculation_method: 'haversine'
        }
      };
    } catch (error) {
      console.error('Error calculating distance:', error.message);
      throw error;
    }
  }
}

module.exports = new DistanceService();

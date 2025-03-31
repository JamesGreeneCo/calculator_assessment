function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
 const R = 6371;
 
 const toRadians = (degrees) => degrees * (Math.PI / 180);
 
 const dLat = toRadians(lat2 - lat1);
 const dLon = toRadians(lon2 - lon1);
 const a = 
   Math.sin(dLat/2) * Math.sin(dLat/2) +
   Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
   Math.sin(dLon/2) * Math.sin(dLon/2);
 
 const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
 const distanceKm = R * c;
 
 return {
   kilometers: parseFloat(distanceKm.toFixed(2)),
   miles: parseFloat((distanceKm * 0.621371).toFixed(2)),
   meters: parseFloat((distanceKm * 1000).toFixed(2))
 };
}

function getFixedCoordinates(address) {
 const hash = address.split('').reduce((acc, char) => {
   return acc + char.charCodeAt(0);
 }, 0);
 
 return {
   lat: 34 + (hash % 10) / 10,
   lng: -118 - (hash % 15) / 10
 };
}

function getDistanceBetween(address1, address2) {
 try {
   const coordinates1 = getFixedCoordinates(address1);
   const coordinates2 = getFixedCoordinates(address2);
   
   const distance = calculateHaversineDistance(
     coordinates1.lat, 
     coordinates1.lng, 
     coordinates2.lat, 
     coordinates2.lng
   );
   
   return {
     address1: {
       query: address1,
       coordinates: coordinates1
     },
     address2: {
       query: address2,
       coordinates: coordinates2
     },
     distance: {
       meters: distance.meters,
       miles: distance.miles,
       kilometers: distance.kilometers
     },
     timestamp: new Date()
   };
 } catch (error) {
   console.error('Error in getDistanceBetween:', error);
   throw new Error(`Failed to calculate distance: ${error.message}`);
 }
}

module.exports = {
 getDistanceBetween
};

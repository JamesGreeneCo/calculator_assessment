export function validateAddressInput(input) {
 if (!input) return '';
 
 const sanitized = input.replace(/<[^>]*>/g, '');
 
 return sanitized.substring(0, 200);
}

export async function getAddressSuggestions(input) {
 if (!input || input.length < 3) return [];
 
 const hasNumberAndStreet = /\d+\s+\w+/.test(input);
 
 if (!hasNumberAndStreet) {
   return [];
 }
 
 try {
   const params = new URLSearchParams({
     q: input,
     format: 'json',
     addressdetails: 1,
     limit: 5,
     'accept-language': 'en'
   });
   
   const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
     headers: {
       'Accept': 'application/json',
       'User-Agent': 'DistanceCalculator/1.0'
     }
   });
   
   if (!response.ok) {
     throw new Error(`API response: ${response.status}`);
   }
   
   const data = await response.json();
   
   return data.map(item => item.display_name);
 } catch (err) {
   console.error('Error fetching address suggestions:', err);
   return [];
 }
}

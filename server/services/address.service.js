function removeAddressSuiteInfo(address) {
 if (!address) return address;
 
 let result = address.replace(/,?\s*\b(suite|ste\.?|apt\.?|apartment|unit|building|bldg\.?|floor|fl\.?)[\s#]*[a-z0-9-]+\b/gi, '');
 
 result = result.replace(/,?\s+#[a-z0-9-]+\b/gi, '');
 
 result = result.replace(/\s*,\s*,\s*/g, ', ');
 result = result.replace(/\s+/g, ' ').trim();
 result = result.replace(/,\s*$/g, '');
 result = result.replace(/\s+,/g, ',');
 
 return result;
}

function processAddress(address) {
 const addressWithoutSuite = removeAddressSuiteInfo(address);
 
 return addressWithoutSuite;
}

module.exports = {
 removeAddressSuiteInfo,
 processAddress
};

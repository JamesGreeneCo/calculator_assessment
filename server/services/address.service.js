function removeAddressSuiteInfo(address) {
    if (!address) return address;
    
    let result = address;
    
    result = result.replace(/\b(s(?:ui)?te|suit|sute|sweet|swite|swt|ste)/gi, 'suite');
    result = result.replace(/\b(ap(?:ar)?t(?:men)?t)/gi, 'apt');
    result = result.replace(/\b(un(?:i)?t)/gi, 'unit');
    result = result.replace(/\b(fl(?:oo)?r)/gi, 'floor');
    result = result.replace(/\b(bu(?:i)?ld(?:in)?g)/gi, 'building');
    
    const unitIdentifierPattern = /,?\s*\b(suite|apartment|apt|unit|building|bldg|floor|room|rm)[\s#.-]*[a-z0-9-]+\b/gi;
    result = result.replace(unitIdentifierPattern, '');
    
    const hashNumberPattern = /,?\s+#[a-z0-9-]+\b/gi;
    result = result.replace(hashNumberPattern, '');
    
    const streetTypeUnitPattern = /\b(street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr|road|rd|way|place|pl|circle|cir|court|ct|terrace|ter|parkway|pkwy)\s+(suite|apartment|apt|unit|building|bldg|floor|room|rm)[\s#.-]*[a-z0-9-]+(?=\s*,|$)/gi;
    result = result.replace(streetTypeUnitPattern, '$1');
    
    const streetNumberPattern = /\b(street|st|avenue|ave|boulevard|blvd|lane|ln|drive|dr|road|rd|way|place|pl|circle|cir|court|ct|terrace|ter|parkway|pkwy)\s+([0-9][0-9a-z-]*)(?=\s*,|$)/gi;
    result = result.replace(streetNumberPattern, '$1');
    
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
  
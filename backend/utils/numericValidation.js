// Utility functions for numeric validation and conversion
// This ensures consistent handling of numeric data across all backend routes

/**
 * Safe numeric conversion function
 * Converts string values to numbers while handling edge cases
 * @param {any} value - The value to convert
 * @returns {number} - The converted numeric value or 0 if conversion fails
 */
export const safeNumericConversion = (value) => {
  // Handle null, undefined, or empty string
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  
  // If already a number, return as is
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  // Convert string to number
  if (typeof value === 'string') {
    // Remove any non-numeric characters except decimal point and minus sign
    const cleanedValue = value.replace(/[^\d.-]/g, '');
    const numericValue = parseFloat(cleanedValue);
    
    // Return 0 if conversion failed
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  // Default fallback
  return 0;
};

/**
 * Validate and convert numeric fields in an object
 * @param {Object} data - The data object to process
 * @param {Array} numericFields - Array of field names that should be numeric
 * @returns {Object} - The processed data object with converted numeric fields
 */
export const validateNumericFields = (data, numericFields) => {
  const processedData = { ...data };
  
  numericFields.forEach(field => {
    if (processedData[field] !== undefined) {
      processedData[field] = safeNumericConversion(processedData[field]);
    }
  });
  
  return processedData;
};

/**
 * List of numeric fields for land records (Marathi field names)
 */
export const MARATHI_NUMERIC_FIELDS = [
  'गांव_नमुना_7_12_नुसार_जमिनीचे_क्षेत्र_हे_आर', // land_area_as_per_7_12
  'संपादित_जमिनीचे_क्षेत्र_चौ_मी_हेक्टर_आर', // acquired_land_area
  'मंजुर_केलेला_दर_प्रति_हेक्टर_रक्कम_रुपये', // approved_rate_per_hectare
  'संपादीत_होणाऱ्या_जमिनीच्या_क्षेत्रानुसार_येणारे_बाजारमुल्य_र_रू', // market_value_as_per_acquired_area
  'कलम_26_2_नुसार_गावास_लागु_असलेले_गणक_Factor_अ_क्र_5_X_8', // factor_as_per_section_26_2
  'कलम_26_नुसार_जमिनीचा_मोबदला_9X10', // land_compensation_as_per_section_26
  'बांधकामे', // structures
  'वनझाडे', // forest_trees
  'फळझाडे', // fruit_trees
  'विहिरी_बोअरवेल', // wells_borewells
  'एकुण_रक्कम_रुपये_16_18_20_22', // total_structures_amount
  'एकुण_रक्कम_14_23', // total_amount_14_23
  'सोलेशियम_दिलासा_रक्कम', // solatium_amount
  'निर्धारित_मोबदला_26', // determined_compensation_26
  'एकूण_रक्कमेवर_25_वाढीव_मोबदला', // enhanced_compensation_25_percent
  'एकुण_मोबदला_26_27', // total_compensation_26_27
  'वजावट_रक्कम_रुपये', // deduction_amount
  'हितसंबंधिताला_अदा_करावयाची_एकुण_मोबदला_रक्कम_रुपये' // final_payable_compensation
];

/**
 * List of numeric fields for land records (English field names)
 */
export const ENGLISH_NUMERIC_FIELDS = [
  'land_area_as_per_7_12',
  'acquired_land_area',
  'approved_rate_per_hectare',
  'market_value_as_per_acquired_area',
  'factor_as_per_section_26_2',
  'land_compensation_as_per_section_26',
  'structures',
  'forest_trees',
  'fruit_trees',
  'wells_borewells',
  'total_structures_amount',
  'total_amount_14_23',
  'solatium_amount',
  'determined_compensation_26',
  'enhanced_compensation_25_percent',
  'total_compensation_26_27',
  'deduction_amount',
  'final_payable_compensation',
  // Legacy fields
  'area',
  'acquired_area',
  'rate',
  'structure_trees_wells_amount',
  'total_compensation',
  'solatium',
  'final_amount'
];

/**
 * Process land record data with numeric validation
 * @param {Object} data - The land record data
 * @param {string} format - The data format ('marathi' or 'english')
 * @returns {Object} - The processed data with validated numeric fields
 */
export const processLandRecordData = (data, format = 'marathi') => {
  const numericFields = format === 'marathi' ? MARATHI_NUMERIC_FIELDS : ENGLISH_NUMERIC_FIELDS;
  return validateNumericFields(data, numericFields);
};

/**
 * Middleware function for validating numeric fields in request body
 * @param {Array} numericFields - Array of field names that should be numeric
 * @returns {Function} - Express middleware function
 */
export const validateNumericMiddleware = (numericFields) => {
  return (req, res, next) => {
    if (req.body) {
      req.body = validateNumericFields(req.body, numericFields);
    }
    next();
  };
};

/**
 * Batch process multiple records with numeric validation
 * @param {Array} records - Array of record objects
 * @param {string} format - The data format ('marathi' or 'english')
 * @returns {Array} - Array of processed records
 */
export const batchProcessRecords = (records, format = 'marathi') => {
  return records.map(record => processLandRecordData(record, format));
};
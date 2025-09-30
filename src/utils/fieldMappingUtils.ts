/**
 * Utility functions for handling field mappings between old and new Excel formats
 */

export interface LandownerRecordAny {
  [key: string]: any;
}

/**
 * Direct field access - NO DYNAMIC MAPPING
 * All fields are now actual database fields, so we access them directly
 */

/**
 * Safely get a field value from a record - DIRECT ACCESS
 */
export const safeGetField = (record: LandownerRecordAny, fieldName: string): any => {
  if (!record) return '';
  
  // Direct field access - no mapping needed
  const value = record[fieldName];
  if (value !== undefined && value !== null && value !== '') {
    return value;
  }
  
  // Fallback for legacy fields only
  const legacyMappings: { [key: string]: string[] } = {
    'landowner_name': ['landowner_name', 'खातेदाराचे_नांव'],
    'survey_number': ['survey_number', 'सर्वे_नं'],
    'area': ['area', 'क्षेत्र'],
    'acquired_area': ['acquired_area', 'संपादित_क्षेत्र'],
    'rate': ['rate', 'दर'],
    'total_compensation': ['total_compensation', 'total_compensation_amount', 'total_final_compensation', 'एकूण_मोबदला'],
    'solatium': ['solatium', 'सोलेशियम_100'],
    'final_amount': ['final_payable_amount', 'final_amount', 'total_final_compensation', 'FinalAmount', 'finalCompensation', 'अंतिम_रक्कम'],
    'structure_trees_wells_amount': ['structure_trees_wells_amount', 'संरचना_झाडे_विहिरी_रक्कम']
  };
  
  if (legacyMappings[fieldName]) {
    for (const legacyField of legacyMappings[fieldName]) {
      const legacyValue = record[legacyField];
      if (legacyValue !== undefined && legacyValue !== null && legacyValue !== '') {
        return legacyValue;
      }
    }
  }
  
  return '';
};

/**
 * Safely get a numeric field value
 */
export const safeGetNumericField = (record: LandownerRecordAny, fieldName: string): number => {
  const value = safeGetField(record, fieldName);
  const numValue = parseFloat(value);
  return isNaN(numValue) ? 0 : numValue;
};

/**
 * Format a number for display
 */
export const formatNumber = (value: any): string => {
  if (value === null || value === undefined || value === '') return '0';
  const num = parseFloat(value);
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-IN');
};

/**
 * Format currency for display
 */
export const formatCurrency = (value: any): string => {
  if (value === null || value === undefined || value === '') return '₹0';
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0';
  return '₹' + num.toLocaleString('en-IN');
};

/**
 * Get display name for landowner (handles both formats)
 */
export const getLandownerName = (record: LandownerRecordAny): string => {
  return safeGetField(record, 'landowner_name') || 'Unknown';
};

/**
 * Get display survey number (prioritizes new survey number)
 */
export const getSurveyNumber = (record: LandownerRecordAny): string => {
  return safeGetField(record, 'survey_number') || 'Unknown';
};

/**
 * Get display area with proper formatting
 */
export const getDisplayArea = (record: LandownerRecordAny): string => {
  const area = safeGetNumericField(record, 'area');
  return area > 0 ? `${area} Ha` : '0 Ha';
};

/**
 * Get display village name
 */
export const getVillageName = (record: LandownerRecordAny): string => {
  return safeGetField(record, 'village') || 'Unknown';
};

/**
 * Get display compensation amount
 */
export const getCompensationAmount = (record: LandownerRecordAny): string => {
  const amount = safeGetNumericField(record, 'final_amount');
  return formatCurrency(amount);
};

/**
 * Get KYC status with proper handling
 */
export const getKycStatus = (record: LandownerRecordAny): string => {
  return safeGetField(record, 'kyc_status') || 'pending';
};

/**
 * Get payment status with proper handling
 */
export const getPaymentStatus = (record: LandownerRecordAny): string => {
  return safeGetField(record, 'payment_status') || 'pending';
};

/**
 * Check if record has new format fields - DIRECT DATABASE FIELD ACCESS
 */
export const isNewFormat = (record: LandownerRecordAny): boolean => {
  // Check for new format database fields directly
  const newFormatIndicators = [
    'data_format', // Metadata field indicating format
    'new_survey_number', // नविन स.नं.
    'group_number', // गट नंबर
    'cts_number', // सी.टी.एस. नंबर
    'land_category', // जमिनीचा प्रकार
    'agricultural_classification', // शेती/वर्ग -1
    'final_payable_amount', // हितसंबंधिताला अदा करावयाची एकुण मोबदला रक्कम रुपये
    'section_26_2_factor', // कलम 26 (2) नुसार गावास लागु असलेले गणक Factor
    'total_structures_amount', // एकुण रक्कम रुपये
    'determined_compensation', // निर्धारित मोबदला
    'additional_25_percent_compensation' // एकूण रक्कमेवर 25% वाढीव मोबदला
  ];
  
  // If data_format is explicitly set, use that
  if (record.data_format === 'parishisht_k') {
    return true;
  }
  
  // Otherwise check for presence of new format fields
  return newFormatIndicators.some(field => 
    record[field] !== undefined && record[field] !== null && record[field] !== ''
  );
};

/**
 * Get all available field names from a record
 */
export const getAvailableFields = (record: LandownerRecordAny): string[] => {
  if (!record) return [];
  return Object.keys(record).filter(key => 
    record[key] !== undefined && record[key] !== null && record[key] !== ''
  );
};

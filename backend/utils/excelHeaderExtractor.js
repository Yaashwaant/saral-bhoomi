import XLSX from 'xlsx';
import { normalizeRowEnhanced, PARIKSHIT_16_FIELD_MAPPINGS } from './excelFieldMappings.js';

/**
 * Extract header information from row 7 of Excel file
 * Typically contains: गावाचे नाव (Village Name), तालुक्याचे नाव (Taluka Name), जिल्ह्याचे नाव (District Name)
 */
export const extractHeaderFromExcel = (fileBuffer, headerRow = 7) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert sheet to JSON to access specific rows
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, // Use array of arrays format
      defval: '', // Default value for empty cells
      raw: false // Get formatted values
    });
    
    // Extract header row (0-indexed, so row 7 is index 6)
    const headerRowData = jsonData[headerRow - 1] || [];
    
    const extractedHeader = {
      village_name: '',
      taluka_name: '',
      district_name: '',
      raw_header_data: headerRowData,
      extraction_successful: false
    };
    
    // Common patterns to identify location information
    const villagePatterns = [
      /गाव.*?[:：]\s*([^,\s]+)/i,
      /village.*?[:：]\s*([^,\s]+)/i,
      /गावाचे\s*नाव.*?[:：]\s*([^,\s]+)/i
    ];
    
    const talukaPatterns = [
      /तालुका.*?[:：]\s*([^,\s]+)/i,
      /taluka.*?[:：]\s*([^,\s]+)/i,
      /तालुक्याचे\s*नाव.*?[:：]\s*([^,\s]+)/i
    ];
    
    const districtPatterns = [
      /जिल्हा.*?[:：]\s*([^,\s]+)/i,
      /district.*?[:：]\s*([^,\s]+)/i,
      /जिल्ह्याचे\s*नाव.*?[:：]\s*([^,\s]+)/i
    ];
    
    // Search through all cells in the header row
    for (let i = 0; i < headerRowData.length; i++) {
      const cellValue = String(headerRowData[i] || '').trim();
      
      if (!cellValue) continue;
      
      // Try to extract village name
      if (!extractedHeader.village_name) {
        for (const pattern of villagePatterns) {
          const match = cellValue.match(pattern);
          if (match) {
            extractedHeader.village_name = match[1].trim();
            break;
          }
        }
      }
      
      // Try to extract taluka name
      if (!extractedHeader.taluka_name) {
        for (const pattern of talukaPatterns) {
          const match = cellValue.match(pattern);
          if (match) {
            extractedHeader.taluka_name = match[1].trim();
            break;
          }
        }
      }
      
      // Try to extract district name
      if (!extractedHeader.district_name) {
        for (const pattern of districtPatterns) {
          const match = cellValue.match(pattern);
          if (match) {
            extractedHeader.district_name = match[1].trim();
            break;
          }
        }
      }
    }
    
    // Alternative: Check if the entire row contains location info in sequence
    const fullRowText = headerRowData.join(' ').toLowerCase();
    
    // Look for common Maharashtra districts if not found
    const maharashtraDistricts = [
      'अहमदनगर', 'अकोला', 'अमरावती', 'औरंगाबाद', 'भंडारा', 'बीड', 'बुलढाणा', 'चंद्रपूर',
      'धुळे', 'गडचिरोली', 'गोंदिया', 'हिंगोली', 'जालना', 'जळगाव', 'कोल्हापूर', 'लातूर',
      'मुंबई शहर', 'मुंबई उपनगर', 'नागपूर', 'नांदेड', 'नंदुरबार', 'नाशिक', 'उस्मानाबाद',
      'पालघर', 'परभणी', 'पुणे', 'रायगड', 'रत्नागिरी', 'सांगली', 'सातारा', 'सिंधुदुर्ग',
      'सोलापूर', 'ठाणे', 'वर्धा', 'वाशिम', 'यवतमाळ'
    ];
    
    if (!extractedHeader.district_name) {
      for (const district of maharashtraDistricts) {
        if (fullRowText.includes(district.toLowerCase())) {
          extractedHeader.district_name = district;
          break;
        }
      }
    }
    
    // Mark extraction as successful if we found at least village or district
    extractedHeader.extraction_successful = !!(extractedHeader.village_name || extractedHeader.district_name);
    
    return extractedHeader;
    
  } catch (error) {
    console.error('Error extracting header from Excel:', error);
    return {
      village_name: '',
      taluka_name: '',
      district_name: '',
      raw_header_data: [],
      extraction_successful: false,
      error: error.message
    };
  }
};

/**
 * Extract Parishisht-K JMR data from Excel file (31-column format)
 */
export const extractJMRDataFromExcel = (fileBuffer, startRow = 2) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Extract header information from row 7 (if present)
    const headerInfo = extractHeaderFromExcel(fileBuffer, 7);
    
    // Convert worksheet to JSON starting from data row (CSV format starts from row 2)
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      range: startRow - 1, // 0-indexed
      header: 1,
      defval: '',
      raw: false
    });
    
    const extractedRecords = jsonData.map((row, index) => {
      // Map exact 31 columns from Parishisht-K format
      const record = {
        // Header information (from row 7 or fallback to last 3 columns)
        village: headerInfo.village_name || row[31] || '',
        taluka: headerInfo.taluka_name || row[32] || '',
        district: headerInfo.district_name || row[33] || '',
        
        // 1-6. Identification Fields
        serial_number: row[0] || '',
        landowner_name: row[1] || '',
        old_survey_number: row[2] || '',
        new_survey_number: row[3] || '',
        group_number: row[4] || '',
        cts_number: row[5] || '',
        
        // 7-8. Area Fields
        total_area_village_record: parseFloat(row[6]) || 0,
        acquired_area_sqm_hectare: parseFloat(row[7]) || 0,
        
        // 9-10. Land Classification
        land_category: row[8] || '',
        land_type_classification: row[9] || '',
        
        // 11-14. Rate and Compensation
        approved_rate_per_hectare: parseFloat(row[10]) || 0,
        market_value_acquired_area: parseFloat(row[11]) || 0,
        section_26_2_factor: parseFloat(row[12]) || 1,
        section_26_compensation: parseFloat(row[13]) || 0,
        
        // 15-23. Structure Compensation
        buildings_count: parseInt(row[14]) || 0,
        buildings_amount: parseFloat(row[15]) || 0,
        forest_trees_count: parseInt(row[16]) || 0,
        forest_trees_amount: parseFloat(row[17]) || 0,
        fruit_trees_count: parseInt(row[18]) || 0,
        fruit_trees_amount: parseFloat(row[19]) || 0,
        wells_borewells_count: parseInt(row[20]) || 0,
        wells_borewells_amount: parseFloat(row[21]) || 0,
        total_structures_amount: parseFloat(row[22]) || 0,
        
        // 24-30. Final Compensation Calculations
        total_compensation_amount: parseFloat(row[23]) || 0,
        solatium_100_percent: parseFloat(row[24]) || 0,
        determined_compensation: parseFloat(row[25]) || 0,
        additional_25_percent_compensation: parseFloat(row[26]) || 0,
        total_final_compensation: parseFloat(row[27]) || 0,
        deduction_amount: parseFloat(row[28]) || 0,
        final_payable_amount: parseFloat(row[29]) || 0,
        
        // 31. Remarks
        remarks: row[30] || '',
        
        // Metadata
        excel_import_metadata: {
          source_file_name: 'uploaded_file.xlsx',
          import_date: new Date(),
          row_number: startRow + index,
          header_extracted_from_row: 7,
          header_extraction_successful: headerInfo.extraction_successful,
          total_columns_processed: 31
        }
      };
      
      return record;
    });
    
    return {
      success: true,
      headerInfo,
      records: extractedRecords,
      total_records: extractedRecords.length,
      format: 'parishisht_k_31_columns'
    };
    
  } catch (error) {
    console.error('Error extracting Parishisht-K JMR data from Excel:', error);
    return {
      success: false,
      error: error.message,
      headerInfo: null,
      records: [],
      total_records: 0
    };
  }
};

/**
 * Validate JMR record data
 */
export const validateJMRRecord = (record) => {
  const errors = [];
  
  // Required fields validation (Parishisht-K format)
  if (!record.new_survey_number && !record.survey_number) {
    errors.push('Survey number (नविन स.नं.) is required');
  }
  if (!record.landowner_name) errors.push('Landowner name (खातेदाराचे नांव) is required');
  if (!record.village && !record.village_name) {
    errors.push('Village name is required (should be extracted from header or last columns)');
  }
  if (!record.total_area_village_record || record.total_area_village_record <= 0) {
    errors.push('Total area (गांव नमुना 7/12) must be greater than 0');
  }
  if (!record.acquired_area_sqm_hectare || record.acquired_area_sqm_hectare <= 0) {
    errors.push('Acquired area (संपादित जमिनीचे क्षेत्र) must be greater than 0');
  }
  if (!record.approved_rate_per_hectare || record.approved_rate_per_hectare <= 0) {
    errors.push('Approved rate per hectare (मंजुर केलेला दर) must be greater than 0');
  }
  
  // Logical validations
  if (record.acquired_area_sqm_hectare > record.total_area_village_record) {
    errors.push('Acquired area cannot be greater than total village record area');
  }
  
  // Compensation calculations validation
  const expectedTotalStructures = (record.buildings_amount || 0) + 
                                  (record.forest_trees_amount || 0) + 
                                  (record.fruit_trees_amount || 0) + 
                                  (record.wells_borewells_amount || 0);
  
  if (Math.abs((record.total_structures_amount || 0) - expectedTotalStructures) > 1) {
    errors.push('Total structures amount does not match sum of individual structure amounts');
  }
  
  const expectedTotalCompensation = (record.section_26_compensation || 0) + (record.total_structures_amount || 0);
  if (Math.abs((record.total_compensation_amount || 0) - expectedTotalCompensation) > 1) {
    errors.push('Total compensation amount calculation mismatch');
  }
  
  const expectedDeterminedCompensation = (record.total_compensation_amount || 0) + (record.solatium_100_percent || 0);
  if (Math.abs((record.determined_compensation || 0) - expectedDeterminedCompensation) > 1) {
    errors.push('Determined compensation calculation mismatch');
  }
  
  const expectedFinalCompensation = (record.determined_compensation || 0) + (record.additional_25_percent_compensation || 0);
  if (Math.abs((record.total_final_compensation || 0) - expectedFinalCompensation) > 1) {
    errors.push('Total final compensation calculation mismatch');
  }
  
  const expectedFinalPayable = (record.total_final_compensation || 0) - (record.deduction_amount || 0);
  if (Math.abs((record.final_payable_amount || 0) - expectedFinalPayable) > 1) {
    errors.push('Final payable amount calculation mismatch');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Extract Parikshit 16 format JMR data (16-column format)
 * This format has headers in row 7 and data starts from row 8
 * @param {Object} workbook - Excel workbook object
 * @param {Object} headerInfo - Header information from extractHeaderFromExcel
 * @returns {Object} Object containing extracted records and header info
 */
export const extractParikshit16DataFromExcel = (workbook, headerInfo) => {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Extract data starting from row 8 (assuming headers are in row 7)
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  const extractedRecords = [];
  
  // Start from row 8 (index 7) for data
  for (let row = 7; row <= range.e.r; row++) {
    const record = {};
    let hasData = false;
    
    // Extract data for each column (A to P for 16 columns)
    for (let col = 0; col < 16; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const headerCellAddress = XLSX.utils.encode_cell({ r: 6, c: col }); // Row 7 for headers
      
      const cell = worksheet[cellAddress];
      const headerCell = worksheet[headerCellAddress];
      
      if (headerCell && cell) {
        const header = headerCell.v;
        const value = cell.v;
        
        // Map header to field name using Parikshit 16 mappings
        if (PARIKSHIT_16_FIELD_MAPPINGS[header]) {
          record[header] = value;
          hasData = true;
        }
      }
    }
    
    if (hasData) {
      // Normalize the record using field mappings
      const normalizedRecord = normalizeRowEnhanced(record);
      
      // Add additional computed fields
      normalizedRecord.data_format = 'parikshit-16';
      normalizedRecord.excel_row = row + 1; // 1-indexed row number
      
      extractedRecords.push(normalizedRecord);
    }
  }
  
  return { records: extractedRecords, headerInfo };
};

/**
 * Validate Parikshit 16 format record
 * @param {Object} record - The record to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
export const validateParikshit16Record = (record) => {
  const errors = [];
  
  // Required fields for Parikshit 16 format
  const requiredFields = [
    'serial_number',
    'landowner_name', 
    'survey_number',
    'area_hectares',
    'land_type',
    'approved_rate_per_hectare',
    'market_value',
    'final_payable_amount'
  ];
  
  // Check required fields
  requiredFields.forEach(field => {
    if (!record[field] || record[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Validate numeric fields
  const numericFields = ['area_hectares', 'approved_rate_per_hectare', 'market_value', 'final_payable_amount'];
  numericFields.forEach(field => {
    if (record[field] && isNaN(parseFloat(record[field]))) {
      errors.push(`${field} must be a valid number`);
    }
  });
  
  // Validate bank details if provided
  if (record.bank_account_number || record.bank_ifsc_code) {
    if (!record.bank_account_number || record.bank_account_number.trim() === '') {
      errors.push('Bank account number is required when IFSC code is provided');
    }
    if (!record.bank_ifsc_code || record.bank_ifsc_code.trim() === '') {
      errors.push('IFSC code is required when bank account number is provided');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  extractHeaderFromExcel,
  extractJMRDataFromExcel,
  extractParikshit16DataFromExcel,
  validateJMRRecord,
  validateParikshit16Record
};

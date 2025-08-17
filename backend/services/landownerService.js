import sequelize from '../config/database.js';

/**
 * Enhanced Landowner Service
 * Provides dynamic data fetching for any missing fields from landowner_records table
 */
class LandownerService {
  
  /**
   * Get complete landowner details by survey number
   * @param {string} surveyNumber - The survey number to search for
   * @returns {Object|null} - Complete landowner details or null if not found
   */
  static async getLandownerBySurveyNumber(surveyNumber) {
    try {
      const landownerRecord = await sequelize.query(
        `SELECT 
          "खातेदाराचे_नांव" as landowner_name,
          "सर्वे_नं" as survey_number,
          "क्षेत्र" as area,
          "संपादित_क्षेत्र" as acquired_area,
          "दर" as rate,
          "संरचना_झाडे_विहिरी_रक्क" as structure_trees_wells_amount,
          "एकूण_मोबदला" as total_compensation,
          "सोलेशियम_100" as solatium,
          "अंतिम_रक्कम" as final_amount,
          village,
          taluka,
          district,
          contact_phone,
          contact_email,
          contact_address,
          is_tribal,
          tribal_certificate_no,
          tribal_lag,
          bank_account_number,
          bank_ifsc_code,
          bank_name,
          bank_branch_name,
          bank_account_holder_name,
          kyc_status,
          payment_status,
          notice_generated,
          notice_number,
          notice_date
        FROM landowner_records 
        WHERE "सर्वे_नं" = :surveyNumber 
        LIMIT 1`,
        { 
          replacements: { surveyNumber },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      return landownerRecord.length > 0 ? landownerRecord[0] : null;
    } catch (error) {
      console.error('Error fetching landowner details:', error);
      throw error;
    }
  }

  /**
   * Get specific field value by survey number
   * @param {string} surveyNumber - The survey number to search for
   * @param {string} fieldName - The specific field to fetch
   * @returns {any|null} - Field value or null if not found
   */
  static async getFieldBySurveyNumber(surveyNumber, fieldName) {
    try {
      // Only map fields that actually exist in landowner_records table
      const fieldMapping = {
        'landowner_name': '"खातेदाराचे_नांव"',
        'survey_number': '"सर्वे_नं"',
        'area': '"क्षेत्र"',
        'acquired_area': '"संपादित_क्षेत्र"',
        'rate': '"दर"',
        'structure_trees_wells_amount': '"संरचना_झाडे_विहिरी_रक्क"',
        'total_compensation': '"एकूण_मोबदला"',
        'solatium': '"सोलेशियम_100"',
        'final_amount': '"अंतिम_रक्कम"',
        'village': 'village',
        'taluka': 'taluka',
        'district': 'district',
        'contact_phone': 'contact_phone',
        'contact_email': 'contact_email',
        'contact_address': 'contact_address',
        'is_tribal': 'is_tribal',
        'tribal_certificate_no': 'tribal_certificate_no',
        'tribal_lag': 'tribal_lag',
        'bank_account_number': 'bank_account_number',
        'bank_ifsc_code': 'bank_ifsc_code',
        'bank_name': 'bank_name',
        'bank_branch_name': 'bank_branch_name',
        'bank_account_holder_name': 'bank_account_holder_name',
        'kyc_status': 'kyc_status',
        'payment_status': 'payment_status',
        'notice_generated': 'notice_generated',
        'notice_number': 'notice_number',
        'notice_date': 'notice_date'
      };

      const dbField = fieldMapping[fieldName];
      if (!dbField) {
        // Return null for fields that don't exist in landowner_records
        console.log(`ℹ️ Field '${fieldName}' not available in landowner_records table`);
        return null;
      }

      const result = await sequelize.query(
        `SELECT ${dbField} as value FROM landowner_records WHERE "सर्वे_नं" = :surveyNumber LIMIT 1`,
        { 
          replacements: { surveyNumber },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      return result.length > 0 ? result[0].value : null;
    } catch (error) {
      console.error(`Error fetching field ${fieldName}:`, error);
      return null; // Return null instead of throwing error
    }
  }

  /**
   * Get multiple fields by survey number
   * @param {string} surveyNumber - The survey number to search for
   * @param {Array} fieldNames - Array of field names to fetch
   * @returns {Object} - Object with field names as keys and values
   */
  static async getMultipleFieldsBySurveyNumber(surveyNumber, fieldNames) {
    try {
      const results = {};
      
      for (const fieldName of fieldNames) {
        try {
          results[fieldName] = await this.getFieldBySurveyNumber(surveyNumber, fieldName);
        } catch (error) {
          console.warn(`Could not fetch field ${fieldName}:`, error.message);
          results[fieldName] = null;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching multiple fields:', error);
      throw error;
    }
  }

  /**
   * Fill missing fields in an object by fetching from landowner_records
   * @param {Object} dataObject - The object that may have missing fields
   * @param {string} surveyNumber - The survey number to use for fetching
   * @param {Array} requiredFields - Array of field names that should be filled
   * @returns {Object} - Object with missing fields filled from landowner_records
   */
  static async fillMissingFields(dataObject, surveyNumber, requiredFields) {
    try {
      const enhancedObject = { ...dataObject };
      const missingFields = [];

      // Check which fields are missing or null/undefined
      for (const field of requiredFields) {
        if (!enhancedObject[field] || enhancedObject[field] === null || enhancedObject[field] === undefined) {
          missingFields.push(field);
        }
      }

      if (missingFields.length === 0) {
        return enhancedObject;
      }

      console.log(`🔄 Fetching missing fields for survey ${surveyNumber}: ${missingFields.join(', ')}`);

      // Fetch missing fields from landowner_records
      const fetchedFields = await this.getMultipleFieldsBySurveyNumber(surveyNumber, missingFields);

      // Fill in the missing fields
      for (const field of missingFields) {
        if (fetchedFields[field] !== null) {
          enhancedObject[field] = fetchedFields[field];
          console.log(`✅ Filled ${field}: ${fetchedFields[field]}`);
        } else {
          console.log(`⚠️ Could not fetch ${field} from landowner_records`);
        }
      }

      return enhancedObject;
    } catch (error) {
      console.error('Error filling missing fields:', error);
      return dataObject; // Return original object if there's an error
    }
  }

  /**
   * Get landowner name by survey number (simple method)
   * @param {string} surveyNumber - The survey number to search for
   * @returns {string|null} - Landowner name or null if not found
   */
  static async getLandownerName(surveyNumber) {
    try {
      const landownerRecord = await sequelize.query(
        'SELECT "खातेदाराचे_नांव" as landowner_name FROM landowner_records WHERE "सर्वे_नं" = :surveyNumber LIMIT 1',
        { 
          replacements: { surveyNumber },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      return landownerRecord.length > 0 ? landownerRecord[0].landowner_name : null;
    } catch (error) {
      console.error('Error fetching landowner name:', error);
      throw error;
    }
  }

  /**
   * Get all landowners for a project
   * @param {number} projectId - The project ID
   * @returns {Array} - Array of landowner records
   */
  static async getLandownersByProject(projectId) {
    try {
      const landownerRecords = await sequelize.query(
        `SELECT 
          "खातेदाराचे_नांव" as landowner_name,
          "सर्वे_नं" as survey_number,
          "क्षेत्र" as area,
          village,
          taluka,
          district,
          kyc_status,
          payment_status,
          notice_generated
        FROM landowner_records 
        WHERE project_id = :projectId AND is_active = true
        ORDER BY "सर्वे_नं"`,
        { 
          replacements: { projectId },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      return landownerRecords;
    } catch (error) {
      console.error('Error fetching project landowners:', error);
      throw error;
    }
  }

  /**
   * Search landowners by name or survey number
   * @param {string} searchTerm - Search term for name or survey number
   * @returns {Array} - Array of matching landowner records
   */
  static async searchLandowners(searchTerm) {
    try {
      const landownerRecords = await sequelize.query(
        `SELECT 
          "खातेदाराचे_नांव" as landowner_name,
          "सर्वे_नं" as survey_number,
          "क्षेत्र" as area,
          village,
          taluka,
          district,
          kyc_status,
          payment_status
        FROM landowner_records 
        WHERE ("खातेदाराचे_नांव" ILIKE :searchTerm OR "सर्वे_नं" ILIKE :searchTerm)
        AND is_active = true
        ORDER BY "खातेदाराचे_नांव"
        LIMIT 20`,
        { 
          replacements: { searchTerm: `%${searchTerm}%` },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      return landownerRecords;
    } catch (error) {
      console.error('Error searching landowners:', error);
      throw error;
    }
  }

  /**
   * Validate if a survey number exists in landowner_records
   * @param {string} surveyNumber - The survey number to validate
   * @returns {boolean} - True if exists, false otherwise
   */
  static async surveyNumberExists(surveyNumber) {
    try {
      const result = await sequelize.query(
        'SELECT EXISTS (SELECT 1 FROM landowner_records WHERE "सर्वे_नं" = :surveyNumber)',
        { 
          replacements: { surveyNumber },
          type: sequelize.QueryTypes.SELECT 
        }
      );
      
      return result[0].exists;
    } catch (error) {
      console.error('Error validating survey number:', error);
      return false;
    }
  }
}

export default LandownerService;

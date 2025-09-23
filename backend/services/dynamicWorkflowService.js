import LandownerService from './landownerService.js';

/**
 * Dynamic Workflow Service
 * Automatically fills missing data by fetching from landowner_records table
 * at the moment it's needed in any workflow step
 */
class DynamicWorkflowService {
  
  /**
   * Enhance JMR Record with missing data from landowner_records
   * @param {Object} jmrRecord - The JMR record object
   * @returns {Object} - Enhanced JMR record with missing fields filled
   */
  static async enhanceJMRRecord(jmrRecord) {
    // Only request fields that exist in landowner_records table
    const requiredFields = [
      'village', 'taluka', 'district'
    ];
    
    return await LandownerService.fillMissingFields(
      jmrRecord, 
      jmrRecord.survey_number, 
      requiredFields
    );
  }

  /**
   * Enhance Award with missing data from landowner_records
   * @param {Object} award - The award object
   * @param {Object} jmrRecord - The associated JMR record
   * @returns {Object} - Enhanced award with missing fields filled
   */
  static async enhanceAward(award, jmrRecord) {
    // Only request fields that exist in landowner_records table
    const requiredFields = [
      'landowner_name', 'village', 'taluka', 'district'
    ];
    
    // First try to get data from JMR record
    let enhancedAward = { ...award };
    
    // Copy available data from JMR
    if (jmrRecord) {
      enhancedAward = {
        ...enhancedAward,
        village: enhancedAward.village || jmrRecord.village,
        taluka: enhancedAward.taluka || jmrRecord.taluka,
        district: enhancedAward.district || jmrRecord.district
      };
    }
    
    // Fill any remaining missing fields from landowner_records
    return await LandownerService.fillMissingFields(
      enhancedAward,
      award.survey_number,
      requiredFields
    );
  }

  /**
   * Enhance Notice with missing data from landowner_records
   * @param {Object} notice - The notice object
   * @param {Object} jmrRecord - The associated JMR record
   * @param {Object} award - The associated award record
   * @returns {Object} - Enhanced notice with missing fields filled
   */
  static async enhanceNotice(notice, jmrRecord, award) {
    // Only request fields that exist in landowner_records table
    const requiredFields = [
      'landowner_name', 'village', 'taluka', 'district'
    ];
    
    // First try to get data from previous records
    let enhancedNotice = { ...notice };
    
    // Copy available data from JMR
    if (jmrRecord) {
      enhancedNotice = {
        ...enhancedNotice,
        village: enhancedNotice.village || jmrRecord.village,
        taluka: enhancedNotice.taluka || jmrRecord.taluka,
        district: enhancedNotice.district || jmrRecord.district
      };
    }
    
    // Copy available data from Award
    if (award) {
      enhancedNotice = {
        ...enhancedNotice,
        landowner_name: enhancedNotice.landowner_name || award.landowner_name
      };
    }
    
    // Fill any remaining missing fields from landowner_records
    return await LandownerService.fillMissingFields(
      enhancedNotice,
      notice.survey_number,
      requiredFields
    );
  }

  /**
   * Enhance Payment with missing data from landowner_records
   * @param {Object} payment - The payment object
   * @param {Object} notice - The associated notice record
   * @returns {Object} - Enhanced payment with missing fields filled
   */
  static async enhancePayment(payment, notice) {
    // Only request fields that exist in landowner_records table
    const requiredFields = [
      'bank_account_number', 'bank_ifsc_code', 'bank_name'
    ];
    
    // First try to get data from notice
    let enhancedPayment = { ...payment };
    
    if (notice) {
      enhancedPayment = {
        ...enhancedPayment,
        amount: enhancedPayment.amount || notice.amount
      };
    }
    
    // Fill any remaining missing fields from landowner_records
    return await LandownerService.fillMissingFields(
      enhancedPayment,
      payment.survey_number,
      requiredFields
    );
  }

  /**
   * Create complete workflow data by filling all missing information
   * @param {string} surveyNumber - The survey number to work with
   * @param {Object} options - Options for data creation
   * @returns {Object} - Complete workflow data with all fields filled
   */
  static async createCompleteWorkflowData(surveyNumber, options = {}) {
    try {
      console.log(`🚀 Creating complete workflow data for survey: ${surveyNumber}`);
      
      // Check if survey number exists in landowner_records
      const surveyExists = await LandownerService.surveyNumberExists(surveyNumber);
      if (!surveyExists) {
        console.warn(`⚠️ Survey number ${surveyNumber} not found in landowner_records`);
      }
      
      // Get base data from landowner_records
      const landownerData = await LandownerService.getLandownerBySurveyNumber(surveyNumber);
      
      // Create enhanced JMR data
      const jmrData = await this.enhanceJMRRecord({
        survey_number: surveyNumber,
        ...options.jmr,
        ...landownerData
      });
      
      // Create enhanced Award data
      const awardData = await this.enhanceAward({
        survey_number: surveyNumber,
        ...options.award
      }, jmrData);
      
      // Create enhanced Notice data
      const noticeData = await this.enhanceNotice({
        survey_number: surveyNumber,
        ...options.notice
      }, jmrData, awardData);
      
      // Create enhanced Payment data
      const paymentData = await this.enhancePayment({
        survey_number: surveyNumber,
        ...options.payment
      }, noticeData);
      
      return {
        survey_number: surveyNumber,
        jmr: jmrData,
        award: awardData,
        notice: noticeData,
        payment: paymentData,
        landowner: landownerData
      };
      
    } catch (error) {
      console.error('Error creating complete workflow data:', error);
      throw error;
    }
  }

  /**
   * Validate workflow completeness for a survey number
   * @param {string} surveyNumber - The survey number to validate
   * @returns {Object} - Validation result with missing fields
   */
  static async validateWorkflowCompleteness(surveyNumber) {
    try {
      const landownerData = await LandownerService.getLandownerBySurveyNumber(surveyNumber);
      
      if (!landownerData) {
        return {
          isComplete: false,
          missingFields: ['landowner_data'],
          message: 'Survey number not found in landowner_records'
        };
      }
      
      const requiredFields = [
        'landowner_name', 'village', 'taluka', 'district',
        'area', 'rate', 'total_compensation'
      ];
      
      const missingFields = requiredFields.filter(field => !landownerData[field]);
      
      return {
        isComplete: missingFields.length === 0,
        missingFields,
        message: missingFields.length === 0 
          ? 'All required fields are present' 
          : `Missing fields: ${missingFields.join(', ')}`
      };
      
    } catch (error) {
      console.error('Error validating workflow completeness:', error);
      return {
        isComplete: false,
        missingFields: ['validation_error'],
        message: `Validation error: ${error.message}`
      };
    }
  }

  /**
   * Get dynamic field suggestions for a survey number
   * @param {string} surveyNumber - The survey number
   * @param {string} context - The context (jmr, award, notice, payment)
   * @returns {Object} - Suggested field values
   */
  static async getFieldSuggestions(surveyNumber, context) {
    try {
      const landownerData = await LandownerService.getLandownerBySurveyNumber(surveyNumber);
      
      if (!landownerData) {
        return null;
      }
      
      // Only suggest fields that actually exist in landowner_records table
      const contextFieldMappings = {
        jmr: ['village', 'taluka', 'district'],
        award: ['landowner_name', 'village', 'taluka', 'district', 'area', 'rate'],
        notice: ['landowner_name', 'village', 'taluka', 'district', 'total_compensation'],
        payment: ['landowner_name', 'bank_account_number', 'bank_ifsc_code', 'bank_name', 'total_compensation']
      };
      
      const relevantFields = contextFieldMappings[context] || [];
      const suggestions = {};
      
      relevantFields.forEach(field => {
        if (landownerData[field]) {
          suggestions[field] = landownerData[field];
        }
      });
      
      return suggestions;
      
    } catch (error) {
      console.error('Error getting field suggestions:', error);
      return null;
    }
  }
}

export default DynamicWorkflowService;

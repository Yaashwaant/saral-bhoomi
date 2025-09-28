// Example integration of BlockchainLifecycleService with existing workflow
// This shows how to integrate blockchain tracking into the existing workflow

import BlockchainLifecycleService from './blockchainLifecycleService.js';

class BlockchainWorkflowIntegration {
  constructor() {
    this.blockchainService = new BlockchainLifecycleService();
  }

  /**
   * Initialize blockchain service
   */
  async initialize() {
    return await this.blockchainService.initialize();
  }

  /**
   * Process Land Record Creation with blockchain tracking
   * This represents data being added to Land Record Management tab
   */
  async createLandRecordWithBlockchain(landRecordData, officerId) {
    try {
      // Record land record creation on blockchain
      const landRecordResult = await this.blockchainService.createLandRecord({
        surveyNumber: landRecordData.survey_number,
        officerId: officerId,
        projectId: landRecordData.project_id,
        landownerName: landRecordData.landowner_name,
        area: landRecordData.area,
        totalCompensation: landRecordData.total_compensation,
        district: landRecordData.district,
        taluka: landRecordData.taluka,
        village: landRecordData.village,
        serialNumber: landRecordData.serial_number,
        oldSurveyNumber: landRecordData.old_survey_number,
        newSurveyNumber: landRecordData.new_survey_number
      });

      if (!landRecordResult.success) {
        throw new Error(`Failed to record land record on blockchain: ${landRecordResult.message}`);
      }

      return {
        success: true,
        transaction: landRecordResult,
        message: 'Land record creation recorded on blockchain'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process Notice Generation and KYC Assignment with blockchain tracking
   * This represents data being accessed from land records for notice generation and KYC assignment
   */
  async generateNoticeWithBlockchain(noticeData, officerId) {
    try {
      // Record notice creation and KYC assignment on blockchain
      const noticeResult = await this.blockchainService.createNotice({
        surveyNumber: noticeData.survey_number,
        officerId: officerId,
        projectId: noticeData.project_id,
        noticeId: noticeData.notice_id,
        noticeNumber: noticeData.notice_number,
        landownerName: noticeData.landowner_name,
        amount: noticeData.amount,
        objectionDeadline: noticeData.objection_deadline,
        kycAgent: noticeData.kyc_agent,
        noticeContent: noticeData.notice_content,
        district: noticeData.district,
        taluka: noticeData.taluka,
        village: noticeData.village
      });

      if (!noticeResult.success) {
        throw new Error(`Failed to record notice generation on blockchain: ${noticeResult.message}`);
      }

      return {
        success: true,
        transaction: noticeResult,
        message: 'Notice generation and KYC assignment recorded on blockchain'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process Document Upload and KYC Approval with blockchain tracking
   * This represents field officer uploading documents and approving KYC
   */
  async processDocumentUploadWithBlockchain(documentData, officerId) {
    try {
      // Record document upload and KYC approval on blockchain
      const documentResult = await this.blockchainService.recordDocumentUpload({
        surveyNumber: documentData.survey_number,
        officerId: officerId,
        projectId: documentData.project_id,
        documents: documentData.attachments || [],
        documentHash: documentData.document_hash,
        kycStatus: documentData.kyc_status || 'approved',
        kycApprovedBy: officerId,
        kycApprovedAt: new Date(),
        district: documentData.district,
        taluka: documentData.taluka,
        village: documentData.village
      });

      if (!documentResult.success) {
        throw new Error(`Failed to record document upload on blockchain: ${documentResult.message}`);
      }

      return {
        success: true,
        transaction: documentResult,
        message: 'Document upload and KYC approval recorded on blockchain'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process Payment Slip Creation with blockchain tracking
   */
  async processPaymentSlipWithBlockchain(paymentData, officerId) {
    try {
      // Record payment slip creation on blockchain
      const paymentResult = await this.blockchainService.createPaymentSlip({
        surveyNumber: paymentData.survey_number,
        officerId: officerId,
        projectId: paymentData.project_id,
        paymentId: paymentData.payment_id,
        amount: paymentData.amount,
        district: paymentData.district,
        taluka: paymentData.taluka,
        village: paymentData.village
      });

      if (!paymentResult.success) {
        throw new Error(`Failed to record payment slip on blockchain: ${paymentResult.message}`);
      }

      return {
        success: true,
        transaction: paymentResult,
        message: 'Payment slip creation recorded on blockchain'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Process Land Acquisition with blockchain tracking
   * This represents the final step where land is marked as acquired in project analytics
   */
  async markLandAcquiredWithBlockchain(acquisitionData, officerId) {
    try {
      // Record land acquisition on blockchain
      const acquisitionResult = await this.blockchainService.markLandAcquired({
        surveyNumber: acquisitionData.survey_number,
        officerId: officerId,
        projectId: acquisitionData.project_id,
        acquiredArea: acquisitionData.acquired_area,
        acquisitionDate: acquisitionData.acquisition_date || new Date(),
        finalAmount: acquisitionData.final_amount,
        district: acquisitionData.district,
        taluka: acquisitionData.taluka,
        village: acquisitionData.village
      });

      if (!acquisitionResult.success) {
        throw new Error(`Failed to record land acquisition on blockchain: ${acquisitionResult.message}`);
      }

      return {
        success: true,
        transaction: acquisitionResult,
        message: 'Land acquisition recorded on blockchain'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get complete audit trail for a survey number
   */
  async getCompleteAuditTrail(surveyNumber, projectData) {
    return await this.blockchainService.getAuditTrail(surveyNumber, projectData);
  }

  /**
   * Verify record integrity
   */
  async verifyRecordIntegrity(surveyNumber, currentData, projectData) {
    return await this.blockchainService.verifyRecordIntegrity(surveyNumber, currentData, projectData);
  }
}

export default BlockchainWorkflowIntegration;
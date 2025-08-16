import { JMRRecord, Award, Notice, Payment, BlockchainLedger, Project, User } from '../models/index.js';
import { createBlock } from './blockchainService.js';
import { generateHashFromCloudinaryUrl } from './cloudinaryService.js';
import { v4 as uuidv4 } from 'uuid';

class WorkflowService {
  /**
   * Process JMR to Award workflow
   */
  async processJMRToAward(jmrData, officerId) {
    try {
      // Check if JMR exists
      const jmr = await JMRRecord.findOne({
        where: { survey_number: jmrData.survey_number, is_active: true }
      });

      if (!jmr) {
        throw new Error(`JMR record not found for survey number: ${jmrData.survey_number}`);
      }

      // Check if award already exists
      const existingAward = await Award.findOne({
        where: { survey_number: jmrData.survey_number, is_active: true }
      });

      if (existingAward) {
        throw new Error(`Award already exists for survey number: ${jmrData.survey_number}`);
      }

      // Create award record
      const awardData = {
        award_id: `AW-${jmrData.survey_number}-${Date.now()}`,
        survey_number: jmrData.survey_number,
        project_id: jmrData.project_id,
        landowner_id: jmrData.landowner_id,
        landowner_name: jmrData.landowner_name || jmrData.landowner_id,
        award_number: jmrData.award_number || `AWD-${jmrData.survey_number}`,
        award_date: jmrData.award_date || new Date(),
        base_amount: jmrData.base_amount || 0,
        solatium: jmrData.solatium || 0,
        additional_amounts: jmrData.additional_amounts || {},
        total_amount: (parseFloat(jmrData.base_amount || 0) + parseFloat(jmrData.solatium || 0)),
        status: 'Draft',
        officer_id: officerId,
        village: jmrData.village,
        taluka: jmrData.taluka,
        district: jmrData.district,
        land_type: jmrData.land_type,
        tribal_classification: jmrData.tribal_classification,
        category: jmrData.category,
        measured_area: jmrData.measured_area,
        unit: jmrData.unit || 'acres',
        jmr_reference: jmr.id,
        notes: jmrData.notes
      };

      const award = await Award.create(awardData);

      // Create blockchain entry
      const blockchainData = {
        survey_number: jmrData.survey_number,
        event_type: 'Award_Declared',
        officer_id: officerId,
        project_id: jmrData.project_id,
        metadata: {
          award_id: award.award_id,
          total_amount: award.total_amount,
          status: award.status
        },
        remarks: `Award declared for survey ${jmrData.survey_number}`
      };

      await createBlock(blockchainData);

      // Update JMR status
      await jmr.update({ status: 'Award_Generated' });

      return {
        success: true,
        award,
        message: 'Award created successfully and recorded on blockchain'
      };
    } catch (error) {
      throw new Error(`Failed to process JMR to Award: ${error.message}`);
    }
  }

  /**
   * Process Award to Notice workflow
   */
  async processAwardToNotice(awardData, officerId) {
    try {
      // Check if award exists
      const award = await Award.findOne({
        where: { survey_number: awardData.survey_number, is_active: true }
      });

      if (!award) {
        throw new Error(`Award not found for survey number: ${awardData.survey_number}`);
      }

      // Check if notice already exists
      const existingNotice = await Notice.findOne({
        where: { survey_number: awardData.survey_number, is_active: true }
      });

      if (existingNotice) {
        throw new Error(`Notice already exists for survey number: ${awardData.survey_number}`);
      }

      // Create notice record
      const noticeData = {
        notice_id: `NT-${awardData.survey_number}-${Date.now()}`,
        survey_number: awardData.survey_number,
        landowner_name: awardData.landowner_name || award.landowner_name,
        amount: awardData.amount || award.total_amount,
        notice_date: awardData.notice_date || new Date(),
        status: 'Draft',
        officer_id: officerId,
        project_id: awardData.project_id || award.project_id,
        village: awardData.village || award.village,
        taluka: awardData.taluka || award.taluka,
        district: awardData.district || award.district,
        land_type: awardData.land_type || award.land_type,
        tribal_classification: awardData.tribal_classification || award.tribal_classification,
        jmr_reference: award.jmr_reference,
        objection_deadline: awardData.objection_deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notice_type: awardData.notice_type || 'Acquisition',
        description: awardData.description || `Notice for survey ${awardData.survey_number}`,
        attachments: awardData.attachments || []
      };

      const notice = await Notice.create(noticeData);

      // Create blockchain entry
      const blockchainData = {
        survey_number: awardData.survey_number,
        event_type: 'Notice_Generated',
        officer_id: officerId,
        project_id: noticeData.project_id,
        metadata: {
          notice_id: notice.notice_id,
          amount: notice.amount,
          status: notice.status,
          objection_deadline: notice.objection_deadline
        },
        remarks: `Notice generated for survey ${awardData.survey_number}`
      };

      await createBlock(blockchainData);

      // Update award status
      await award.update({ status: 'Notice_Generated' });

      return {
        success: true,
        notice,
        message: 'Notice created successfully and recorded on blockchain'
      };
    } catch (error) {
      throw new Error(`Failed to process Award to Notice: ${error.message}`);
    }
  }

  /**
   * Process Notice to Document Upload workflow
   */
  async processNoticeToDocumentUpload(noticeData, officerId) {
    try {
      // Check if notice exists
      const notice = await Notice.findOne({
        where: { survey_number: noticeData.survey_number, is_active: true }
      });

      if (!notice) {
        throw new Error(`Notice not found for survey number: ${noticeData.survey_number}`);
      }

      // Generate document hash for blockchain
      let documentHash = '';
      if (noticeData.attachments && noticeData.attachments.length > 0) {
        const attachmentUrls = noticeData.attachments.map(att => att.cloudinary_url).join('|');
        const attachmentHashes = noticeData.attachments.map(att => att.document_hash).join('|');
        documentHash = await generateHashFromCloudinaryUrl(
          attachmentUrls,
          `${noticeData.survey_number}-${attachmentHashes}-${Date.now()}`
        );
      }

      // Update notice with document upload information
      const updateData = {
        status: 'Documents_Uploaded',
        attachments: noticeData.attachments || notice.attachments,
        description: noticeData.description || notice.description,
        document_hash: documentHash
      };

      await notice.update(updateData);

      // Create blockchain entry with document hash
      const blockchainData = {
        survey_number: noticeData.survey_number,
        event_type: 'Documents_Uploaded',
        officer_id: officerId,
        project_id: notice.project_id,
        metadata: {
          notice_id: notice.notice_id,
          attachments_count: (noticeData.attachments || []).length,
          status: 'Documents_Uploaded',
          document_hash: documentHash,
          cloudinary_urls: noticeData.attachments ? noticeData.attachments.map(att => att.cloudinary_url) : []
        },
        remarks: `Documents uploaded for notice ${notice.notice_id} with hash ${documentHash}`
      };

      await createBlock(blockchainData);

      return {
        success: true,
        notice,
        message: 'Documents uploaded successfully and recorded on blockchain',
        document_hash: documentHash
      };
    } catch (error) {
      throw new Error(`Failed to process Notice to Document Upload: ${error.message}`);
    }
  }

  /**
   * Process Notice to Payment Slip workflow
   */
  async processNoticeToPaymentSlip(paymentData, officerId) {
    try {
      // Check if notice exists
      const notice = await Notice.findOne({
        where: { survey_number: paymentData.survey_number, is_active: true }
      });

      if (!notice) {
        throw new Error(`Notice not found for survey number: ${paymentData.survey_number}`);
      }

      // Check if payment already exists
      const existingPayment = await Payment.findOne({
        where: { survey_number: paymentData.survey_number, is_active: true }
      });

      if (existingPayment) {
        throw new Error(`Payment already exists for survey number: ${paymentData.survey_number}`);
      }

      // Create payment record
      const paymentRecordData = {
        payment_id: `PAY-${paymentData.survey_number}-${Date.now()}`,
        survey_number: paymentData.survey_number,
        notice_id: notice.notice_id,
        amount: paymentData.amount || notice.amount,
        status: 'Pending',
        reason_if_pending: paymentData.reason_if_pending || 'Awaiting approval',
        officer_id: officerId,
        project_id: paymentData.project_id || notice.project_id,
        payment_date: paymentData.payment_date || new Date(),
        payment_method: paymentData.payment_method || 'Bank Transfer',
        bank_details: paymentData.bank_details || {},
        utr_number: paymentData.utr_number || null,
        receipt_path: paymentData.receipt_path || null,
        notes: paymentData.notes || `Payment slip generated for notice ${notice.notice_id}`
      };

      const payment = await Payment.create(paymentRecordData);

      // Create blockchain entry
      const blockchainData = {
        survey_number: paymentData.survey_number,
        event_type: 'Payment_Slip_Created',
        officer_id: officerId,
        project_id: paymentRecordData.project_id,
        metadata: {
          payment_id: payment.payment_id,
          amount: payment.amount,
          status: payment.status,
          notice_id: notice.notice_id
        },
        remarks: `Payment slip created for survey ${paymentData.survey_number}`
      };

      await createBlock(blockchainData);

      // Update notice status
      await notice.update({ status: 'Payment_Initiated' });

      return {
        success: true,
        payment,
        message: 'Payment slip created successfully and recorded on blockchain'
      };
    } catch (error) {
      throw new Error(`Failed to process Notice to Payment Slip: ${error.message}`);
    }
  }

  /**
   * Process Payment Release workflow
   */
  async processPaymentRelease(paymentData, officerId) {
    try {
      // Check if payment exists
      const payment = await Payment.findOne({
        where: { survey_number: paymentData.survey_number, is_active: true }
      });

      if (!payment) {
        throw new Error(`Payment not found for survey number: ${paymentData.survey_number}`);
      }

      // Update payment status
      const updateData = {
        status: 'Success',
        utr_number: paymentData.utr_number || payment.utr_number,
        receipt_path: paymentData.receipt_path || payment.receipt_path,
        notes: paymentData.notes || payment.notes
      };

      await payment.update(updateData);

      // Create blockchain entry
      const blockchainData = {
        survey_number: paymentData.survey_number,
        event_type: 'Payment_Released',
        officer_id: officerId,
        project_id: payment.project_id,
        metadata: {
          payment_id: payment.payment_id,
          amount: payment.amount,
          status: 'Success',
          utr_number: updateData.utr_number
        },
        remarks: `Payment released for survey ${paymentData.survey_number}`
      };

      await createBlock(blockchainData);

      // Update notice status
      const notice = await Notice.findOne({
        where: { survey_number: paymentData.survey_number, is_active: true }
      });
      if (notice) {
        await notice.update({ status: 'Payment_Completed' });
      }

      return {
        success: true,
        payment,
        message: 'Payment released successfully and recorded on blockchain'
      };
    } catch (error) {
      throw new Error(`Failed to process Payment Release: ${error.message}`);
    }
  }

  /**
   * Get complete workflow status for a survey number
   */
  async getWorkflowStatus(surveyNumber) {
    try {
      const jmr = await JMRRecord.findOne({
        where: { survey_number: surveyNumber, is_active: true }
      });

      const award = await Award.findOne({
        where: { survey_number: surveyNumber, is_active: true }
      });

      const notice = await Notice.findOne({
        where: { survey_number: surveyNumber, is_active: true }
      });

      const payment = await Payment.findOne({
        where: { survey_number: surveyNumber, is_active: true }
      });

      const blockchainEntries = await BlockchainLedger.findAll({
        where: { survey_number: surveyNumber },
        order: [['timestamp', 'ASC']]
      });

      return {
        survey_number: surveyNumber,
        workflow: {
          jmr: jmr ? { status: jmr.status, created_at: jmr.createdAt } : null,
          award: award ? { status: award.status, created_at: award.createdAt } : null,
          notice: notice ? { status: notice.status, created_at: notice.createdAt } : null,
          payment: payment ? { status: payment.status, created_at: payment.createdAt } : null
        },
        blockchain_entries: blockchainEntries.map(entry => ({
          event_type: entry.event_type,
          timestamp: entry.timestamp,
          officer_id: entry.officer_id,
          is_valid: entry.is_valid
        }))
      };
    } catch (error) {
      throw new Error(`Failed to get workflow status: ${error.message}`);
    }
  }

  /**
   * Bulk process workflow for multiple survey numbers
   */
  async bulkProcessWorkflow(bulkData, officerId, workflowType) {
    try {
      const results = [];
      const errors = [];

      for (const data of bulkData) {
        try {
          let result;
          switch (workflowType) {
            case 'jmr_to_award':
              result = await this.processJMRToAward(data, officerId);
              break;
            case 'award_to_notice':
              result = await this.processAwardToNotice(data, officerId);
              break;
            case 'notice_to_documents':
              result = await this.processNoticeToDocumentUpload(data, officerId);
              break;
            case 'notice_to_payment':
              result = await this.processNoticeToPaymentSlip(data, officerId);
              break;
            case 'payment_release':
              result = await this.processPaymentRelease(data, officerId);
              break;
            default:
              throw new Error(`Unknown workflow type: ${workflowType}`);
          }
          results.push({ success: true, data: result, survey_number: data.survey_number });
        } catch (error) {
          errors.push({ success: false, error: error.message, survey_number: data.survey_number });
        }
      }

      return {
        total: bulkData.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      };
    } catch (error) {
      throw new Error(`Bulk workflow processing failed: ${error.message}`);
    }
  }
}

export default new WorkflowService();

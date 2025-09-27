// Temporarily commenting out imports during MongoDB migration
// import { PaymentRecord, LandownerRecord, Project } from '../models/index.js';
import { LandownerRecord, Project } from '../models/index.js';
import rtgsService from './rtgsService.js';

class PaymentValidationService {
  constructor() {
    this.maxAmount = 10000000; // 1 crore
    this.minAmount = 1000; // 1 thousand
    this.maxRetries = 3;
  }

  /**
   * Validate payment data before processing
   */
  async validatePaymentData(paymentData) {
    const errors = [];
    const warnings = [];

    try {
      const {
        landownerRecordId,
        amount,
        bankAccountNumber,
        ifscCode,
        accountHolderName
      } = paymentData;

      // 1. Validate landowner record
      const landownerValidation = await this.validateLandownerRecord(landownerRecordId);
      if (!landownerValidation.isValid) {
        errors.push(...landownerValidation.errors);
      }

      // 2. Validate amount
      const amountValidation = this.validateAmount(amount);
      if (!amountValidation.isValid) {
        errors.push(...amountValidation.errors);
      } else {
        warnings.push(...amountValidation.warnings);
      }

      // 3. Validate bank details
      const bankValidation = this.validateBankDetails(bankAccountNumber, ifscCode, accountHolderName);
      if (!bankValidation.isValid) {
        errors.push(...bankValidation.errors);
      }

      // 4. Check for duplicate payments
      const duplicateValidation = await this.checkDuplicatePayments(landownerRecordId, amount);
      if (!duplicateValidation.isValid) {
        errors.push(...duplicateValidation.errors);
      }

      // 5. Validate business rules
      const businessValidation = await this.validateBusinessRules(paymentData);
      if (!businessValidation.isValid) {
        errors.push(...businessValidation.errors);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data: {
          landownerValidation,
          amountValidation,
          bankValidation,
          duplicateValidation,
          businessValidation
        }
      };

    } catch (error) {
      console.error('Payment validation error:', error);
      return {
        isValid: false,
        errors: ['Payment validation failed due to system error'],
        warnings: [],
        data: null
      };
    }
  }

  /**
   * Validate landowner record
   */
  async validateLandownerRecord(landownerRecordId) {
    const errors = [];

    try {
      const record = await LandownerRecord.findByPk(landownerRecordId, {
        include: [{ model: Project, attributes: ['projectName', 'status'] }]
      });

      if (!record) {
        errors.push('Landowner record not found');
        return { isValid: false, errors };
      }

      // Check if record is active
      if (!record.isActive) {
        errors.push('Landowner record is inactive');
      }

      // Check KYC status
      if (record.kycStatus !== 'approved') {
        errors.push('KYC must be approved before payment');
      }

      // Check if payment is already completed
      if (record.paymentStatus === 'success') {
        errors.push('Payment already completed for this record');
      }

      // Check project status
      if (record.Project && record.Project.status !== 'active') {
        errors.push('Project is not active');
      }

      return {
        isValid: errors.length === 0,
        errors,
        record
      };

    } catch (error) {
      console.error('Landowner record validation error:', error);
      return {
        isValid: false,
        errors: ['Failed to validate landowner record'],
        record: null
      };
    }
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount) {
    const errors = [];
    const warnings = [];

    const numAmount = parseFloat(amount);

    // Check if amount is a valid number
    if (isNaN(numAmount)) {
      errors.push('Invalid amount format');
      return { isValid: false, errors, warnings };
    }

    // Check minimum amount
    if (numAmount < this.minAmount) {
      errors.push(`Amount must be at least ₹${this.minAmount.toLocaleString('en-IN')}`);
    }

    // Check maximum amount
    if (numAmount > this.maxAmount) {
      errors.push(`Amount cannot exceed ₹${this.maxAmount.toLocaleString('en-IN')}`);
    }

    // Check for suspicious amounts
    if (numAmount > 5000000) { // 50 lakhs
      warnings.push('Large payment amount detected. Please verify.');
    }

    // Check for round numbers (potential suspicious)
    if (numAmount % 100000 === 0 && numAmount > 1000000) {
      warnings.push('Round number payment detected. Please verify.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      amount: numAmount
    };
  }

  /**
   * Validate bank details
   */
  validateBankDetails(bankAccountNumber, ifscCode, accountHolderName) {
    const errors = [];

    // Validate account number
    if (!bankAccountNumber || !/^\d{9,18}$/.test(bankAccountNumber)) {
      errors.push('Invalid bank account number format');
    }

    // Validate IFSC code
    if (!ifscCode || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      errors.push('Invalid IFSC code format');
    }

    // Validate account holder name
    if (!accountHolderName || accountHolderName.trim().length < 3) {
      errors.push('Account holder name is required and must be at least 3 characters');
    }

    // Check for suspicious patterns
    if (accountHolderName && /^(test|demo|sample)/i.test(accountHolderName)) {
      errors.push('Test account holder name detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for duplicate payments
   */
  async checkDuplicatePayments(landownerRecordId, amount) {
    const errors = [];

    try {
      // Check for recent payments to the same landowner
      const recentPayments = await PaymentRecord.findAll({
        where: {
          landownerRecordId,
          paymentStatus: ['success', 'processing'],
          createdAt: {
            [require('sequelize').Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      });

      if (recentPayments.length > 0) {
        errors.push('Duplicate payment detected for the same landowner within 24 hours');
      }

      // Check for same amount payments
      const sameAmountPayments = await PaymentRecord.findAll({
        where: {
          landownerRecordId,
          amount: parseFloat(amount),
          paymentStatus: ['success', 'processing']
        }
      });

      if (sameAmountPayments.length > 0) {
        errors.push('Payment with same amount already exists for this landowner');
      }

      return {
        isValid: errors.length === 0,
        errors,
        recentPayments: recentPayments.length,
        sameAmountPayments: sameAmountPayments.length
      };

    } catch (error) {
      console.error('Duplicate payment check error:', error);
      return {
        isValid: false,
        errors: ['Failed to check for duplicate payments'],
        recentPayments: 0,
        sameAmountPayments: 0
      };
    }
  }

  /**
   * Validate business rules
   */
  async validateBusinessRules(paymentData) {
    const errors = [];
    const warnings = [];

    try {
      const { landownerRecordId, amount } = paymentData;

      // Get landowner record with project details
      const record = await LandownerRecord.findByPk(landownerRecordId, {
        include: [{ model: Project, attributes: ['projectName', 'budget', 'totalCompensation'] }]
      });

      if (!record) {
        errors.push('Landowner record not found for business rule validation');
        return { isValid: false, errors, warnings };
      }

      // Check if payment amount matches compensation amount
      const compensationAmount = parseFloat(record.अंतिम_रक्कम);
      const paymentAmount = parseFloat(amount);

      if (Math.abs(compensationAmount - paymentAmount) > 1) { // Allow 1 rupee difference for rounding
        errors.push(`Payment amount (₹${paymentAmount.toLocaleString('en-IN')}) does not match compensation amount (₹${compensationAmount.toLocaleString('en-IN')})`);
      }

      // Check project budget constraints
      if (record.Project) {
        const projectBudget = parseFloat(record.Project.budget) || 0;
        const totalCompensation = parseFloat(record.Project.totalCompensation) || 0;

        if (totalCompensation + paymentAmount > projectBudget) {
          warnings.push('Payment may exceed project budget');
        }
      }

      // Check for weekend payments (business rule)
      const now = new Date();
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        warnings.push('Payment initiated on weekend');
      }

      // Check for after-hours payments
      const hour = now.getHours();
      if (hour < 9 || hour > 17) { // Before 9 AM or after 5 PM
        warnings.push('Payment initiated outside business hours');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      console.error('Business rule validation error:', error);
      return {
        isValid: false,
        errors: ['Failed to validate business rules'],
        warnings: []
      };
    }
  }

  /**
   * Validate account with bank (optional validation)
   */
  async validateAccountWithBank(accountNumber, ifscCode) {
    try {
      const result = await rtgsService.validateAccountWithBank(accountNumber, ifscCode);
      
      if (!result.success) {
        return {
          isValid: false,
          errors: [result.error.message],
          bankValidation: result
        };
      }

      return {
        isValid: result.data.isValid,
        errors: result.data.isValid ? [] : ['Bank account validation failed'],
        warnings: [],
        bankValidation: result
      };

    } catch (error) {
      console.error('Bank account validation error:', error);
      return {
        isValid: false,
        errors: ['Failed to validate account with bank'],
        bankValidation: null
      };
    }
  }

  /**
   * Validate payment for retry
   */
  async validatePaymentForRetry(paymentRecordId) {
    const errors = [];

    try {
      const paymentRecord = await PaymentRecord.findByPk(paymentRecordId);

      if (!paymentRecord) {
        errors.push('Payment record not found');
        return { isValid: false, errors };
      }

      // Check if payment is eligible for retry
      if (!paymentRecord.isEligibleForRetry()) {
        errors.push('Payment is not eligible for retry');
      }

      // Check retry count
      if (paymentRecord.retryCount >= this.maxRetries) {
        errors.push(`Maximum retry attempts (${this.maxRetries}) exceeded`);
      }

      // Check if payment was recently retried
      if (paymentRecord.lastRetryAt) {
        const timeSinceLastRetry = Date.now() - new Date(paymentRecord.lastRetryAt).getTime();
        const minRetryInterval = 5 * 60 * 1000; // 5 minutes

        if (timeSinceLastRetry < minRetryInterval) {
          errors.push('Payment was recently retried. Please wait before retrying again.');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        paymentRecord
      };

    } catch (error) {
      console.error('Payment retry validation error:', error);
      return {
        isValid: false,
        errors: ['Failed to validate payment for retry'],
        paymentRecord: null
      };
    }
  }

  /**
   * Validate bulk payment data
   */
  async validateBulkPayments(paymentsData) {
    const results = [];
    let totalAmount = 0;

    for (const paymentData of paymentsData) {
      const validation = await this.validatePaymentData(paymentData);
      results.push({
        paymentData,
        validation,
        isValid: validation.isValid
      });

      if (validation.isValid) {
        totalAmount += parseFloat(paymentData.amount);
      }
    }

    // Additional bulk validation
    const bulkErrors = [];
    const bulkWarnings = [];

    // Check total amount limit
    if (totalAmount > this.maxAmount * 10) { // 10 crore limit for bulk payments
      bulkErrors.push('Total bulk payment amount exceeds limit');
    }

    // Check for duplicate landowner records
    const landownerIds = paymentsData.map(p => p.landownerRecordId);
    const uniqueIds = new Set(landownerIds);
    if (landownerIds.length !== uniqueIds.size) {
      bulkErrors.push('Duplicate landowner records found in bulk payment');
    }

    return {
      isValid: results.every(r => r.isValid) && bulkErrors.length === 0,
      results,
      totalAmount,
      bulkErrors,
      bulkWarnings,
      summary: {
        total: paymentsData.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length
      }
    };
  }
}

// Create singleton instance
const paymentValidationService = new PaymentValidationService();

export default paymentValidationService;

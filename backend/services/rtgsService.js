import axios from 'axios';
import crypto from 'crypto';

class RTGSService {
  constructor() {
    this.baseURL = process.env.RTGS_API_BASE_URL || 'https://api.rtgs.bank.gov.in';
    this.apiKey = process.env.RTGS_API_KEY;
    this.secretKey = process.env.RTGS_SECRET_KEY;
    this.merchantId = process.env.RTGS_MERCHANT_ID;
    this.timeout = 30000; // 30 seconds
    
    // Initialize axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Merchant-ID': this.merchantId
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`RTGS API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('RTGS API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`RTGS API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('RTGS API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate digital signature for request
   */
  generateSignature(data, timestamp) {
    const payload = JSON.stringify(data) + timestamp + this.secretKey;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Validate IFSC code format
   */
  validateIFSC(ifscCode) {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifscCode);
  }

  /**
   * Validate bank account number
   */
  validateAccountNumber(accountNumber) {
    // Basic validation - account number should be 9-18 digits
    const accountRegex = /^\d{9,18}$/;
    return accountRegex.test(accountNumber);
  }

  /**
   * Validate payment amount
   */
  validateAmount(amount) {
    const numAmount = parseFloat(amount);
    return numAmount > 0 && numAmount <= 10000000; // Max 1 crore
  }

  /**
   * Initiate RTGS payment
   */
  async initiatePayment(paymentData) {
    try {
      const {
        transactionId,
        amount,
        bankAccountNumber,
        ifscCode,
        accountHolderName,
        narration = 'Land Acquisition Compensation'
      } = paymentData;

      // Validate input data
      if (!this.validateIFSC(ifscCode)) {
        throw new Error('Invalid IFSC code format');
      }

      if (!this.validateAccountNumber(bankAccountNumber)) {
        throw new Error('Invalid bank account number');
      }

      if (!this.validateAmount(amount)) {
        throw new Error('Invalid payment amount');
      }

      const timestamp = new Date().toISOString();
      
      const requestPayload = {
        merchantTransactionId: transactionId,
        amount: parseFloat(amount).toFixed(2),
        beneficiaryAccountNumber: bankAccountNumber,
        beneficiaryIFSC: ifscCode,
        beneficiaryName: accountHolderName,
        narration: narration,
        timestamp: timestamp,
        requestId: `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      // Generate digital signature
      const signature = this.generateSignature(requestPayload, timestamp);

      const requestData = {
        ...requestPayload,
        signature: signature,
        merchantId: this.merchantId
      };

      console.log('RTGS Payment Request:', {
        transactionId,
        amount,
        beneficiaryAccount: bankAccountNumber,
        beneficiaryIFSC: ifscCode
      });

      const response = await this.client.post('/api/v1/rtgs/initiate', requestData);

      if (response.data.success) {
        return {
          success: true,
          data: {
            rtgsReferenceId: response.data.rtgsReferenceId,
            status: 'initiated',
            message: 'Payment initiated successfully',
            timestamp: timestamp
          },
          requestData: requestData,
          responseData: response.data
        };
      } else {
        throw new Error(response.data.message || 'Payment initiation failed');
      }

    } catch (error) {
      console.error('RTGS Payment Initiation Error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message,
          code: error.response?.status || 'NETWORK_ERROR',
          details: error.response?.data || null
        }
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(rtgsReferenceId) {
    try {
      const timestamp = new Date().toISOString();
      
      const requestPayload = {
        rtgsReferenceId: rtgsReferenceId,
        timestamp: timestamp,
        requestId: `STATUS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const signature = this.generateSignature(requestPayload, timestamp);

      const requestData = {
        ...requestPayload,
        signature: signature,
        merchantId: this.merchantId
      };

      const response = await this.client.post('/api/v1/rtgs/status', requestData);

      if (response.data.success) {
        return {
          success: true,
          data: {
            status: response.data.status,
            utrNumber: response.data.utrNumber,
            processedAt: response.data.processedAt,
            message: response.data.message
          },
          responseData: response.data
        };
      } else {
        throw new Error(response.data.message || 'Status check failed');
      }

    } catch (error) {
      console.error('RTGS Status Check Error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message,
          code: error.response?.status || 'NETWORK_ERROR',
          details: error.response?.data || null
        }
      };
    }
  }

  /**
   * Cancel payment (if possible)
   */
  async cancelPayment(rtgsReferenceId) {
    try {
      const timestamp = new Date().toISOString();
      
      const requestPayload = {
        rtgsReferenceId: rtgsReferenceId,
        timestamp: timestamp,
        requestId: `CANCEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const signature = this.generateSignature(requestPayload, timestamp);

      const requestData = {
        ...requestPayload,
        signature: signature,
        merchantId: this.merchantId
      };

      const response = await this.client.post('/api/v1/rtgs/cancel', requestData);

      if (response.data.success) {
        return {
          success: true,
          data: {
            status: 'cancelled',
            message: 'Payment cancelled successfully',
            timestamp: timestamp
          },
          responseData: response.data
        };
      } else {
        throw new Error(response.data.message || 'Payment cancellation failed');
      }

    } catch (error) {
      console.error('RTGS Payment Cancellation Error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message,
          code: error.response?.status || 'NETWORK_ERROR',
          details: error.response?.data || null
        }
      };
    }
  }

  /**
   * Get bank details by IFSC
   */
  async getBankDetails(ifscCode) {
    try {
      if (!this.validateIFSC(ifscCode)) {
        throw new Error('Invalid IFSC code format');
      }

      const response = await this.client.get(`/api/v1/bank/details/${ifscCode}`);

      if (response.data.success) {
        return {
          success: true,
          data: {
            bankName: response.data.bankName,
            branchName: response.data.branchName,
            address: response.data.address,
            city: response.data.city,
            state: response.data.state
          }
        };
      } else {
        throw new Error(response.data.message || 'Bank details not found');
      }

    } catch (error) {
      console.error('RTGS Bank Details Error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message,
          code: error.response?.status || 'NETWORK_ERROR'
        }
      };
    }
  }

  /**
   * Validate account number with bank
   */
  async validateAccountWithBank(accountNumber, ifscCode) {
    try {
      if (!this.validateAccountNumber(accountNumber)) {
        throw new Error('Invalid account number format');
      }

      if (!this.validateIFSC(ifscCode)) {
        throw new Error('Invalid IFSC code format');
      }

      const timestamp = new Date().toISOString();
      
      const requestPayload = {
        accountNumber: accountNumber,
        ifscCode: ifscCode,
        timestamp: timestamp,
        requestId: `VALIDATE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      const signature = this.generateSignature(requestPayload, timestamp);

      const requestData = {
        ...requestPayload,
        signature: signature,
        merchantId: this.merchantId
      };

      const response = await this.client.post('/api/v1/account/validate', requestData);

      if (response.data.success) {
        return {
          success: true,
          data: {
            isValid: response.data.isValid,
            accountHolderName: response.data.accountHolderName,
            accountType: response.data.accountType
          }
        };
      } else {
        throw new Error(response.data.message || 'Account validation failed');
      }

    } catch (error) {
      console.error('RTGS Account Validation Error:', error);
      
      return {
        success: false,
        error: {
          message: error.response?.data?.message || error.message,
          code: error.response?.status || 'NETWORK_ERROR'
        }
      };
    }
  }
}

// Create singleton instance
const rtgsService = new RTGSService();

export default rtgsService;


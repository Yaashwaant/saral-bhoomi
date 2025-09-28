// saral-bhoomi/backend/services/blockchainLifecycleService.js
import { ethers } from 'ethers';
import crypto from 'crypto';
import BlockchainConfig from '../config/blockchain.js';
import { BlockchainLedger } from '../models/index.js';

/**
 * Enhanced Blockchain Lifecycle Service for complete land record tracking
 * Implements immutable audit trail for all land record transactions
 */
class BlockchainLifecycleService {
  constructor() {
    this.config = new BlockchainConfig();
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
    this.retryConfig = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2
    };
  }

  /**
   * Initialize blockchain connection and smart contract
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return { success: true, message: 'Already initialized' };
      }

      if (!this.config.isBlockchainEnabled()) {
        return { 
          success: false, 
          message: 'Blockchain is disabled in configuration' 
        };
      }

      // Validate configuration
      const validation = this.config.validate();
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize provider with explicit network configuration
      this.provider = new ethers.JsonRpcProvider(
        this.config.getNetworkInfo().rpcUrl,
        {
          name: "polygon-amoy",
          chainId: 80002
        }
      );
      
      // Initialize signer
      this.signer = new ethers.Wallet(this.config.getWalletInfo().privateKey, this.provider);
      
      // Load contract ABI and initialize contract
      const contractInfo = this.config.getContractInfo();
      const contractABI = await this.loadEnhancedContractABI(contractInfo.abiPath);
      
      this.contract = new ethers.Contract(
        contractInfo.address,
        contractABI,
        this.signer
      );

      this.isInitialized = true;
      
      console.log('✅ Blockchain Lifecycle Service initialized successfully');
      console.log(`🌐 Network: ${this.config.getNetworkInfo().name}`);
      console.log(`📜 Contract: ${contractInfo.address}`);
      console.log(`👤 Wallet: ${this.config.getWalletInfo().address}`);
      
      return {
        success: true,
        message: 'Blockchain Lifecycle Service initialized successfully',
        network: this.config.getNetworkInfo(),
        contract: contractInfo.address
      };

    } catch (error) {
      console.error('❌ Failed to initialize blockchain lifecycle service:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Load enhanced contract ABI with lifecycle management functions
   */
  async loadEnhancedContractABI(abiPath) {
    try {
      return [
        // Land Record Lifecycle Functions
        "function createLandRecord(string projectName, string district, string taluka, string village, string surveyNumber, string ownerId, string landType, uint256 area, string location, string dataHash) external returns (bytes32)",
        "function updateLandRecord(bytes32 recordId, string surveyNumber, string newData, string changeReason, string officerId) external returns (bool)",
        "function getLandRecord(bytes32 recordId) external view returns (tuple(bytes32 recordId, string projectName, string district, string taluka, string village, string surveyNumber, string ownerId, string landType, uint256 area, string location, string dataHash, uint256 timestamp, string status, address lastModifiedBy, uint256 modificationCount))",
        "function getRecordBySurveyNumber(string projectName, string district, string taluka, string village, string surveyNumber) external view returns (tuple(bytes32 recordId, string projectName, string district, string taluka, string village, string surveyNumber, string ownerId, string landType, uint256 area, string location, string dataHash, uint256 timestamp, string status, address lastModifiedBy, uint256 modificationCount))",
        
        // Workflow Stage Management
        "function recordWorkflowStage(bytes32 recordId, string stage, string officerId, string metadata, string documentHash) external returns (bool)",
        "function getWorkflowHistory(bytes32 recordId) external view returns (tuple(string stage, string officerId, uint256 timestamp, string metadata, string documentHash)[])",
        "function getCurrentStage(bytes32 recordId) external view returns (string stage, uint256 timestamp, string officerId)",
        
        // Document Management
        "function addDocument(bytes32 recordId, string documentType, string documentHash, string cloudinaryUrl, string officerId) external returns (bool)",
        "function getDocuments(bytes32 recordId) external view returns (tuple(string documentType, string documentHash, string cloudinaryUrl, uint256 uploadTime, string uploadedBy)[])",
        "function verifyDocument(bytes32 recordId, string documentHash) external view returns (bool isValid, uint256 uploadTime, string uploadedBy)",
        
        // Payment Tracking
        "function recordPayment(bytes32 recordId, string paymentId, uint256 amount, string paymentType, string officerId) external returns (bool)",
        "function updatePaymentStatus(bytes32 recordId, string paymentId, string status, string transactionHash, string officerId) external returns (bool)",
        "function getPaymentHistory(bytes32 recordId) external view returns (tuple(string paymentId, uint256 amount, string paymentType, string status, uint256 timestamp, string transactionHash, string processedBy)[])",
        
        // KYC and Officer Management
        "function assignKYCOfficer(bytes32 recordId, string officerId, string assignmentType) external returns (bool)",
        "function completeKYC(bytes32 recordId, string officerId, string kycStatus, string verificationHash) external returns (bool)",
        "function getKYCAssignments(bytes32 recordId) external view returns (tuple(string officerId, string assignmentType, string status, uint256 assignedAt, uint256 completedAt, string verificationHash)[])",
        
        // Audit and Integrity
        "function verifyRecordIntegrity(bytes32 recordId, string dataHash) external view returns (bool isValid, uint256 lastModified, string lastModifiedBy)",
        "function getRecordAuditTrail(bytes32 recordId) external view returns (tuple(string action, string performedBy, uint256 timestamp, string metadata)[])",
        "function calculateRecordHash(string projectName, string district, string taluka, string village, string surveyNumber) external pure returns (bytes32)",
        
        // Authorization
        "function isAuthorizedOfficer(address officer) external view returns (bool)",
        "function addAuthorizedOfficer(address officer) external",
        "function removeAuthorizedOfficer(address officer) external"
      ];
    } catch (error) {
      console.error('Failed to load enhanced contract ABI:', error);
      throw new Error('Failed to load enhanced contract ABI');
    }
  }

  /**
   * Generate unique record ID using project + location + survey number
   */
  generateRecordId(projectName, district, taluka, village, surveyNumber) {
    const combinedString = `${projectName}|${district}|${taluka}|${village}|${surveyNumber}`;
    return crypto.createHash('sha256').update(combinedString).digest('hex');
  }

  /**
   * Generate data hash for integrity verification
   */
  generateDataHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  /**
   * Safe operation wrapper with retry logic
   */
  async safeOperation(operation, context = {}) {
    let lastError;
    
    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempting ${context.operation || 'blockchain operation'} (attempt ${attempt}/${this.retryConfig.maxRetries})`);
        const result = await operation();
        
        if (result.success !== false) {
          console.log(`✅ ${context.operation || 'Operation'} successful on attempt ${attempt}`);
          return result;
        }
        
        throw new Error(result.message || 'Operation failed');
        
      } catch (error) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.retryConfig.maxRetries) {
          const delay = this.retryConfig.retryDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`💥 All attempts failed for ${context.operation || 'operation'}`);
    return {
      success: false,
      message: `Operation failed after ${this.retryConfig.maxRetries} attempts: ${lastError.message}`,
      error: lastError.toString()
    };
  }

  /**
   * Create initial land record on blockchain (starting point of workflow)
   * This represents data being added to the Land Record Management tab
   */
  async createLandRecord(landRecordData) {
    return await this.safeOperation(async () => {
      try {
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }

        const { 
          surveyNumber, 
          officerId, 
          projectId, 
          landownerName, 
          area, 
          village, 
          taluka, 
          district, 
          totalCompensation,
          serialNumber,
          oldSurveyNumber,
          newSurveyNumber
        } = landRecordData;
        
        // Generate unique record ID for this land parcel
        const recordId = this.generateRecordId(projectId, district, taluka, village, surveyNumber);
        
        // Create data hash for integrity
        const dataHash = this.generateDataHash(landRecordData);
        
        const gasSettings = this.config.getGasSettings();
        
        // Record land record creation on blockchain
        const tx = await this.contract.createLandRecord(
          projectId,
          district,
          taluka,
          village,
          surveyNumber,
          landownerName,
          'ACQUISITION',
          area,
          village,
          dataHash,
          {
            gasLimit: gasSettings.limit,
            maxFeePerGas: gasSettings.maxFeePerGas,
            maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas
          }
        );

        const receipt = await tx.wait();
        
        // Create local blockchain ledger entry
        const ledgerEntry = await this.createBlockchainLedger({
          survey_number: surveyNumber,
          event_type: 'Land_Record_Created',
          officer_id: officerId,
          project_id: projectId,
          metadata: {
            record_id: recordId,
            landowner_name: landownerName,
            area: area,
            total_compensation: totalCompensation,
            serial_number: serialNumber,
            old_survey_number: oldSurveyNumber,
            new_survey_number: newSurveyNumber,
            data_hash: dataHash,
            transaction_hash: tx.hash,
            block_number: receipt.blockNumber
          },
          remarks: `Land record created for survey ${surveyNumber} - ${landownerName}`
        });

        return {
          success: true,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          recordId: recordId,
          gasUsed: receipt.gasUsed.toString(),
          ledgerEntry: ledgerEntry,
          message: 'Land record created successfully on blockchain'
        };

      } catch (error) {
        console.error('Failed to create land record:', error);
        return {
          success: false,
          message: error.message,
          error: error.toString()
        };
      }
    }, { operation: 'createLandRecord' });
  }

  /**
   * Record notice generation and KYC assignment on blockchain
   * This represents data being accessed from land records for notice generation and KYC assignment
   */
  async createNotice(noticeData) {
    return await this.safeOperation(async () => {
      const { 
        surveyNumber, 
        officerId, 
        projectId, 
        noticeId, 
        amount, 
        objectionDeadline, 
        district, 
        taluka, 
        village,
        landownerName,
        kycAgent,
        noticeContent,
        noticeNumber
      } = noticeData;
      
      // Get existing record ID from land record
      const recordId = this.generateRecordId(projectId, district, taluka, village, surveyNumber);
      
      // Create data hash for integrity
      const dataHash = this.generateDataHash(noticeData);
      
      // Record notice creation on blockchain
      const tx = await this.contract.recordWorkflowStage(
        recordId,
        surveyNumber,
        'Notice_Generated',
        officerId,
        dataHash,
        JSON.stringify(noticeData)
      );
      
      // Create local ledger entry
      await this.createBlockchainLedger({
        survey_number: surveyNumber,
        event_type: 'Notice_Generated',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          record_id: recordId,
          notice_id: noticeId,
          notice_number: noticeNumber,
          landowner_name: landownerName,
          amount,
          objection_deadline: objectionDeadline,
          kyc_agent: kycAgent,
          notice_content: noticeContent,
          data_hash: dataHash,
          transaction_hash: tx.hash
        },
        remarks: `Notice generated and KYC assigned for survey ${surveyNumber} to ${kycAgent}`
      });
      
      return {
        success: true,
        recordId,
        transactionHash: tx.hash,
        dataHash
      };
    }, 'createNotice');
  }

  /**
   * Record document upload and KYC approval by field officer on blockchain
   * This represents documents being uploaded by field officer and KYC being approved
   */
  async recordDocumentUpload(documentData) {
    return await this.safeOperation(async () => {
      const { 
        surveyNumber, 
        officerId, 
        projectId, 
        documents, 
        documentHash, 
        district, 
        taluka, 
        village,
        kycStatus,
        kycApprovedBy,
        kycApprovedAt
      } = documentData;
      
      // Get existing record ID
      const recordId = this.generateRecordId(projectId, district, taluka, village, surveyNumber);
      
      // Record document upload as workflow stage
      const tx = await this.contract.recordWorkflowStage(
        recordId,
        'Documents_Uploaded',
        officerId,
        JSON.stringify(documents || []),
        documentHash
      );
      
      // Create local ledger entry
      await this.createBlockchainLedger({
        survey_number: surveyNumber,
        event_type: 'Documents_Uploaded',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          record_id: recordId,
          document_hash: documentHash,
          documents_count: (documents || []).length,
          kyc_status: kycStatus,
          kyc_approved_by: kycApprovedBy,
          kyc_approved_at: kycApprovedAt,
          transaction_hash: tx.hash
        },
        remarks: `Documents uploaded and KYC ${kycStatus} for survey ${surveyNumber}`
      });
      
      return {
        success: true,
        recordId,
        transactionHash: tx.hash,
        documentHash
      };
    }, 'recordDocumentUpload');
  }

  /**
   * Record KYC assignment and completion
   */
  async recordKYCActivity(surveyNumber, kycData, officerId, projectData = {}) {
    return await this.safeOperation(async () => {
      try {
        if (!this.contract) {
          throw new Error('Contract not initialized');
        }

        const { projectName, district, taluka, village } = projectData;
        const recordId = this.generateRecordId(projectName, district, taluka, village, surveyNumber);
        
        const gasSettings = this.config.getGasSettings();
        let tx;
        
        if (kycData.action === 'assign') {
          tx = await this.contract.assignKYCOfficer(
            recordId,
            officerId,
            kycData.assignmentType || 'KYC_VERIFICATION',
            {
              gasLimit: gasSettings.limit,
              maxFeePerGas: gasSettings.maxFeePerGas,
              maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas
            }
          );
        } else if (kycData.action === 'complete') {
          const verificationHash = this.generateDataHash(kycData.verificationData || {});
          tx = await this.contract.completeKYC(
            recordId,
            officerId,
            kycData.status || 'COMPLETED',
            verificationHash,
            {
              gasLimit: gasSettings.limit,
              maxFeePerGas: gasSettings.maxFeePerGas,
              maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas
            }
          );
        } else {
          throw new Error('Invalid KYC action. Use "assign" or "complete"');
        }

        const receipt = await tx.wait();
        
        // Create local blockchain ledger entry
        const eventType = kycData.action === 'assign' ? 'KYC_OFFICER_ASSIGNED' : 'KYC_COMPLETED';
        const ledgerEntry = await this.createBlockchainLedger({
          survey_number: surveyNumber,
          event_type: eventType,
          officer_id: officerId,
          project_id: projectData.projectId,
          metadata: {
            record_id: recordId,
            action: kycData.action,
            assignment_type: kycData.assignmentType,
            status: kycData.status,
            transaction_hash: tx.hash,
            block_number: receipt.blockNumber,
            ...kycData
          },
          remarks: `KYC ${kycData.action} for survey ${surveyNumber}`
        });

        return {
          success: true,
          transactionHash: tx.hash,
          blockNumber: receipt.blockNumber,
          action: kycData.action,
          gasUsed: receipt.gasUsed.toString(),
          ledgerEntry: ledgerEntry,
          message: `KYC ${kycData.action} recorded successfully`
        };

      } catch (error) {
        console.error('Failed to record KYC activity:', error);
        return {
          success: false,
          message: error.message,
          error: error.toString()
        };
      }
    }, { operation: 'recordKYCActivity' });
  }

  /**
   * Record payment slip creation on blockchain (part of workflow)
   */
  async createPaymentSlip(paymentSlipData) {
    return await this.safeOperation(async () => {
      const { surveyNumber, officerId, projectId, paymentId, amount, district, taluka, village } = paymentSlipData;
      
      // Get existing record ID
      const recordId = this.generateRecordId(projectId, district, taluka, village, surveyNumber);
      
      // Create data hash for integrity
      const dataHash = this.generateDataHash(paymentSlipData);
      
      // Record payment slip creation as workflow stage
      const tx = await this.contract.recordWorkflowStage(
        recordId,
        'Payment_Slip_Created',
        officerId,
        JSON.stringify(paymentSlipData),
        dataHash
      );
      
      // Create local ledger entry
      await this.createBlockchainLedger({
        survey_number: surveyNumber,
        event_type: 'Payment_Slip_Created',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          record_id: recordId,
          payment_id: paymentId,
          amount,
          data_hash: dataHash,
          transaction_hash: tx.hash
        },
        remarks: `Payment slip created for survey ${surveyNumber}`
      });
      
      return {
        success: true,
        recordId,
        transactionHash: tx.hash,
        dataHash
      };
    }, 'createPaymentSlip');
  }

  /**
   * Record actual payment release (separate from payment slip generation)
   */
  async recordPaymentRelease(paymentReleaseData) {
    return await this.safeOperation(async () => {
      const { surveyNumber, officerId, projectId, paymentId, amount, utrNumber, district, taluka, village } = paymentReleaseData;
      
      // Get existing record ID
      const recordId = this.generateRecordId(projectId, district, taluka, village, surveyNumber);
      
      // Create data hash for integrity
      const dataHash = this.generateDataHash(paymentReleaseData);
      
      // Record payment release as separate activity (not workflow stage)
      const tx = await this.contracts.payment.recordPaymentRelease(
        recordId,
        paymentId,
        amount,
        utrNumber,
        officerId,
        dataHash
      );
      
      // Create local ledger entry
      await this.createBlockchainLedger({
        survey_number: surveyNumber,
        event_type: 'Payment_Released',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          record_id: recordId,
          payment_id: paymentId,
          amount,
          utr_number: utrNumber,
          data_hash: dataHash,
          transaction_hash: tx.hash
        },
        remarks: `Payment released for survey ${surveyNumber}`
      });
      
      return {
        success: true,
        recordId,
        transactionHash: tx.hash,
        dataHash
      };
    }, 'recordPaymentRelease');
  }

  /**
   * Mark land as acquired in project analytics
   * This represents the final step where land is marked as acquired
   */
  async markLandAcquired(acquisitionData) {
    return await this.safeOperation(async () => {
      const { 
        surveyNumber, 
        officerId, 
        projectId, 
        district, 
        taluka, 
        village,
        acquiredArea,
        acquisitionDate,
        finalAmount
      } = acquisitionData;
      
      // Get existing record ID
      const recordId = this.generateRecordId(projectId, district, taluka, village, surveyNumber);
      
      // Create data hash for integrity
      const dataHash = this.generateDataHash(acquisitionData);
      
      // Record land acquisition on blockchain
      const tx = await this.contract.recordWorkflowStage(
        recordId,
        'Land_Acquired',
        officerId,
        JSON.stringify(acquisitionData),
        dataHash
      );
      
      // Create local ledger entry
      await this.createBlockchainLedger({
        survey_number: surveyNumber,
        event_type: 'Land_Acquired',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          record_id: recordId,
          acquired_area: acquiredArea,
          acquisition_date: acquisitionDate,
          final_amount: finalAmount,
          data_hash: dataHash,
          transaction_hash: tx.hash
        },
        remarks: `Land acquired for survey ${surveyNumber} - ${acquiredArea} area`
      });
      
      return {
        success: true,
        recordId,
        transactionHash: tx.hash,
        dataHash
      };
    }, 'markLandAcquired');
  }

  /**
   * Create blockchain ledger entry in local database
   */
  async createBlockchainLedger(ledgerData) {
    try {
      const blockId = `BLOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const ledgerEntry = new BlockchainLedger({
        block_id: blockId,
        survey_number: ledgerData.survey_number,
        event_type: ledgerData.event_type,
        officer_id: ledgerData.officer_id,
        project_id: ledgerData.project_id,
        metadata: ledgerData.metadata,
        remarks: ledgerData.remarks,
        timestamp: new Date(),
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: this.generateDataHash(ledgerData),
        is_valid: true,
        block_status: 'mined'
      });

      await ledgerEntry.save();
      console.log(`📝 Blockchain ledger entry created: ${blockId}`);
      
      return ledgerEntry;
    } catch (error) {
      console.error('Failed to create blockchain ledger entry:', error);
      throw error;
    }
  }

  /**
   * Get complete audit trail for a survey number
   */
  async getAuditTrail(surveyNumber, projectData = {}) {
    try {
      // Get from local blockchain ledger
      const ledgerEntries = await BlockchainLedger.find({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: 1 });

      // Get from blockchain if available
      let blockchainTrail = null;
      if (this.contract && projectData.projectName) {
        try {
          const recordId = this.generateRecordId(
            projectData.projectName,
            projectData.district,
            projectData.taluka,
            projectData.village,
            surveyNumber
          );
          
          blockchainTrail = await this.contract.getRecordAuditTrail(recordId);
        } catch (error) {
          console.warn('Could not fetch blockchain audit trail:', error.message);
        }
      }

      return {
        success: true,
        surveyNumber: surveyNumber,
        localTrail: ledgerEntries.map(entry => ({
          timestamp: entry.timestamp,
          eventType: entry.event_type,
          officerId: entry.officer_id,
          metadata: entry.metadata,
          remarks: entry.remarks,
          transactionHash: entry.metadata?.transaction_hash,
          blockNumber: entry.metadata?.block_number
        })),
        blockchainTrail: blockchainTrail,
        totalEntries: ledgerEntries.length,
        integrityVerified: blockchainTrail !== null
      };
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Verify record integrity
   */
  async verifyRecordIntegrity(surveyNumber, currentData, projectData = {}) {
    try {
      if (!this.contract || !projectData.projectName) {
        // Fallback to local verification
        const ledgerEntries = await BlockchainLedger.find({ 
          survey_number: surveyNumber,
          event_type: 'LAND_RECORD_CREATED'
        }).sort({ timestamp: -1 }).limit(1);

        if (ledgerEntries.length === 0) {
          return {
            success: false,
            message: 'No land record found for integrity verification'
          };
        }

        const originalHash = ledgerEntries[0].metadata.data_hash;
        const currentHash = this.generateDataHash(currentData);

        return {
          success: true,
          isValid: originalHash === currentHash,
          originalHash: originalHash,
          currentHash: currentHash,
          verificationMethod: 'local',
          message: originalHash === currentHash ? 'Record integrity verified' : 'Record integrity compromised'
        };
      }

      const recordId = this.generateRecordId(
        projectData.projectName,
        projectData.district,
        projectData.taluka,
        projectData.village,
        surveyNumber
      );

      const currentDataHash = this.generateDataHash(currentData);
      const result = await this.contract.verifyRecordIntegrity(recordId, currentDataHash);

      return {
        success: true,
        isValid: result.isValid,
        lastModified: result.lastModified.toString(),
        lastModifiedBy: result.lastModifiedBy,
        verificationMethod: 'blockchain',
        message: result.isValid ? 'Record integrity verified on blockchain' : 'Record integrity check failed'
      };
    } catch (error) {
      console.error('Failed to verify record integrity:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Get service status
   */
  async getServiceStatus() {
    try {
      const networkStatus = await this.getNetworkStatus();
      const configSummary = this.config.getSummary();
      
      return {
        initialized: this.isInitialized,
        blockchainEnabled: this.config.isBlockchainEnabled(),
        network: networkStatus,
        configuration: configSummary,
        serviceHealth: networkStatus.connected ? 'healthy' : 'unhealthy',
        lastHealthCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        initialized: false,
        blockchainEnabled: false,
        network: { connected: false, message: error.message },
        configuration: null,
        serviceHealth: 'error',
        lastHealthCheck: new Date().toISOString(),
        error: error.toString()
      };
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus() {
    try {
      if (!this.provider) {
        return {
          connected: false,
          message: 'Provider not initialized'
        };
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();
      const balance = await this.provider.getBalance(this.config.getWalletInfo().address);

      return {
        connected: true,
        network: this.config.getNetworkInfo().name,
        chainId: network.chainId,
        blockNumber: blockNumber.toString(),
        gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei') + ' gwei',
        maxPriorityFee: ethers.formatUnits(gasPrice.maxPriorityFeePerGas || 0, 'gwei') + ' gwei',
        maxFee: ethers.formatUnits(gasPrice.maxFeePerGas || 0, 'gwei') + ' gwei',
        walletBalance: ethers.formatEther(balance) + ' MATIC',
        pendingTransactions: 0,
        totalTransactions: 0,
        serviceStatus: 'Blockchain Lifecycle Service Active'
      };

    } catch (error) {
      console.error('Failed to get network status:', error);
      return {
        connected: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Check if blockchain is enabled
   */
  isBlockchainEnabled() {
    return this.config.isBlockchainEnabled();
  }

  /**
   * Get service information
   */
  getServiceInfo() {
    return {
      initialized: this.isInitialized,
      network: this.config.getNetworkInfo(),
      contract: this.config.getContractInfo(),
      wallet: this.config.getWalletInfo(),
      gas: this.config.getGasSettings(),
      serviceName: 'BlockchainLifecycleService',
      version: '1.0.0'
    };
  }
}

export default BlockchainLifecycleService;
import { ethers } from 'ethers';
import crypto from 'crypto';
import BlockchainConfig from '../config/blockchain.js';
import { MongoBlockchainLedger } from '../models/mongo/BlockchainLedger.js';
import { MongoJMRRecord } from '../models/mongo/JMRRecord.js';
import { MongoLandownerRecord } from '../models/mongo/LandownerRecord.js';
import { MongoProject } from '../models/mongo/Project.js';

class EnhancedBlockchainService {
  constructor() {
    this.config = new BlockchainConfig();
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isInitialized = false;
    this.pollingInterval = null;
    this.lastProcessedBlock = 0;
  }

  /**
   * Initialize the blockchain service
   */
  async initialize() {
    try {
      if (this.isInitialized) {
        return { success: true, message: 'Already initialized' };
      }

      // Validate configuration
      const validation = this.config.validate();
      if (!validation.isValid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Initialize provider with fallback
      try {
        const wsUrl = this.config.getNetworkInfo().wsUrl;
        this.provider = new ethers.WebSocketProvider(wsUrl);
        console.log('🌐 WebSocket provider initialized');
      } catch (wsError) {
        console.log('⚠️ WebSocket failed, using HTTP provider');
        this.provider = new ethers.JsonRpcProvider(
          this.config.getNetworkInfo().rpcUrl,
          {
            name: "polygon-amoy",
            chainId: 80002
          }
        );
      }

      // Initialize wallet
      const walletInfo = this.config.getWalletInfo();
      this.wallet = new ethers.Wallet(walletInfo.privateKey, this.provider);
      console.log('🔐 Enhanced blockchain wallet initialized');

      // Initialize contract
      const contractInfo = this.config.getContractInfo();
      const contractABI = await this.loadContractABI(contractInfo.abiPath);
      this.contract = new ethers.Contract(contractInfo.address, contractABI, this.wallet);
      console.log('📜 Enhanced smart contract initialized');

      // Set up event polling
      await this.setupEventPolling();

      this.isInitialized = true;
      console.log('✅ Enhanced blockchain service initialized successfully');

      return {
        success: true,
        message: 'Enhanced blockchain service initialized successfully',
        network: this.config.getNetworkInfo(),
        contract: contractInfo.address
      };
    } catch (error) {
      console.error('❌ Failed to initialize enhanced blockchain service:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Load contract ABI
   */
  async loadContractABI(abiPath) {
    try {
      // Basic ABI for land records
      return [
        "function createLandRecord(string surveyNumber, string ownerId, string landType, uint256 area, string location, string dataHash) external",
        "function updateLandRecord(string surveyNumber, string newDataHash, string changeReason) external",
        "function getLandRecord(string surveyNumber) external view returns (tuple(string surveyNumber, string ownerId, string landType, uint256 area, string location, uint256 timestamp, string hash))",
        "function verifyRecordIntegrity(string surveyNumber, string dataHash) external view returns (bool)",
        "function isAuthorizedOfficer(address officer) external view returns (bool)",
        "function addAuthorizedOfficer(address officer) external",
        "function removeAuthorizedOfficer(address officer) external",
        "event LandRecordCreated(string surveyNumber, string ownerId, string dataHash, uint256 timestamp)",
        "event LandRecordUpdated(string surveyNumber, string newDataHash, uint256 timestamp)",
        "event LandRecordDeleted(string surveyNumber, uint256 timestamp)"
      ];
    } catch (error) {
      console.error('Failed to load contract ABI:', error);
      throw error;
    }
  }

  /**
   * Set up event polling system
   */
  async setupEventPolling() {
    try {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
      }

      // Poll every 60 seconds for new events
      this.pollingInterval = setInterval(async () => {
        await this.pollForNewEvents();
      }, 60000);

      console.log('✅ Event polling system set up successfully (no filters)');
    } catch (error) {
      console.error('❌ Failed to set up event polling:', error);
    }
  }

  /**
   * Poll for new blockchain events
   */
  async pollForNewEvents() {
    try {
      if (!this.provider || !this.contract) return;

      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(this.lastProcessedBlock + 1, currentBlock - 1000);

      if (fromBlock > currentBlock) return;

      const logs = await this.provider.getLogs({
        address: this.contract.target,
        fromBlock,
        toBlock: currentBlock
      });

      for (const log of logs) {
        try {
          const decodedLog = this.contract.interface.parseLog(log);
          if (decodedLog && decodedLog.name) {
            await this.processBlockchainEvent(decodedLog, log);
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse log:', parseError.message);
        }
      }

      this.lastProcessedBlock = currentBlock;
    } catch (error) {
      console.error('❌ Event polling failed:', error.message);
    }
  }

  /**
   * Process blockchain events
   */
  async processBlockchainEvent(decodedLog, log) {
    try {
      const { name, args } = decodedLog;
      const timestamp = new Date();

      switch (name) {
        case 'LandRecordCreated':
          await this.handleLandRecordCreated(args, timestamp);
          break;
        case 'LandRecordUpdated':
          await this.handleLandRecordUpdated(args, timestamp);
          break;
        case 'LandRecordDeleted':
          await this.handleLandRecordDeleted(args, timestamp);
          break;
        default:
          console.log(`ℹ️ Unhandled event: ${name}`);
      }
    } catch (error) {
      console.error('❌ Event processing failed:', error.message);
    }
  }

  /**
   * Handle land record created event
   */
  async handleLandRecordCreated(args, timestamp) {
    try {
      const [surveyNumber, ownerId, dataHash] = args;
      
      await MongoBlockchainLedger.create({
        survey_number: surveyNumber,
        event_type: 'LAND_RECORD_CREATED',
        officer_id: 1, // Default officer
        metadata: {
          owner_id: ownerId,
          data_hash: dataHash,
          block_number: timestamp.getTime()
        },
        timestamp: timestamp.toISOString(),
        block_id: crypto.randomBytes(16).toString('hex'),
        current_hash: dataHash,
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true
      });

      console.log(`✅ Land record created event processed: ${surveyNumber}`);
    } catch (error) {
      console.error('❌ Failed to process land record created event:', error);
    }
  }

  /**
   * Handle land record updated event
   */
  async handleLandRecordUpdated(args, timestamp) {
    try {
      const [surveyNumber, newDataHash] = args;
      
      await MongoBlockchainLedger.create({
        survey_number: surveyNumber,
        event_type: 'LAND_RECORD_UPDATED',
        officer_id: 1, // Default officer
        metadata: {
          new_data_hash: newDataHash,
          block_number: timestamp.getTime()
        },
        timestamp: timestamp.toISOString(),
        block_id: crypto.randomBytes(16).toString('hex'),
        current_hash: newDataHash,
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true
      });

      console.log(`✅ Land record updated event processed: ${surveyNumber}`);
    } catch (error) {
      console.error('❌ Failed to process land record updated event:', error);
    }
  }

  /**
   * Handle land record deleted event
   */
  async handleLandRecordDeleted(args, timestamp) {
    try {
      const [surveyNumber] = args;
      
      await MongoBlockchainLedger.create({
        survey_number: surveyNumber,
        event_type: 'LAND_RECORD_DELETED',
        officer_id: 1, // Default officer
        metadata: {
          deletion_timestamp: timestamp.toISOString(),
          block_number: timestamp.getTime()
        },
        timestamp: timestamp.toISOString(),
        block_id: crypto.randomBytes(16).toString('hex'),
        current_hash: crypto.randomBytes(32).toString('hex'),
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true
      });

      console.log(`✅ Land record deleted event processed: ${surveyNumber}`);
    } catch (error) {
      console.error('❌ Failed to process land record deleted event:', error);
    }
  }

  /**
   * Generate hash for land record data
   */
  generateDataHash(recordData) {
    try {
      const dataString = JSON.stringify(recordData, Object.keys(recordData).sort());
      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      console.error('❌ Failed to generate data hash:', error);
      throw error;
    }
  }

  /**
   * Create blockchain ledger entry for any land record operation
   */
  async createLedgerEntry(entryData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const {
        survey_number,
        event_type,
        officer_id,
        metadata = {},
        project_id,
        remarks,
        timestamp,
        record_data = null
      } = entryData;

      // Generate unique block ID
      const blockId = crypto.randomBytes(16).toString('hex');

      // Generate hash from record data if provided
      let currentHash = crypto.randomBytes(32).toString('hex');
      if (record_data) {
        currentHash = this.generateDataHash(record_data);
      }

      // Get previous hash for this survey
      const previousEntry = await MongoBlockchainLedger.findOne({
        survey_number,
        event_type: { $ne: 'LAND_RECORD_DELETED' }
      }).sort({ timestamp: -1 });

      const previousHash = previousEntry ? previousEntry.current_hash : '0x0000000000000000000000000000000000000000000000000000000000000000';

      // Create ledger entry
      const ledgerEntry = {
        survey_number,
        event_type,
        officer_id,
        timestamp: timestamp || new Date().toISOString(),
        metadata,
        project_id,
        remarks,
        block_id: blockId,
        previous_hash: previousHash,
        current_hash: currentHash,
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true
      };

      // Store in database
      const savedEntry = await MongoBlockchainLedger.create(ledgerEntry);

      console.log('📝 Blockchain ledger entry created:', {
        survey_number,
        event_type,
        block_id: blockId,
        hash: currentHash
      });

      return savedEntry;
    } catch (error) {
      console.error('❌ Failed to create ledger entry:', error);
      throw error;
    }
  }

  /**
   * Create blockchain entry for JMR record
   */
  async createJMRBlockchainEntry(jmrRecord, officerId, projectId) {
    try {
      const recordData = {
        survey_number: jmrRecord.survey_number,
        measured_area: jmrRecord.measured_area,
        land_type: jmrRecord.land_type,
        tribal_classification: jmrRecord.tribal_classification,
        village: jmrRecord.village,
        taluka: jmrRecord.taluka,
        district: jmrRecord.district,
        owner_id: jmrRecord.owner_id,
        project_id: jmrRecord.project_id,
        created_at: jmrRecord.created_at,
        updated_at: jmrRecord.updated_at
      };

      return await this.createLedgerEntry({
        survey_number: jmrRecord.survey_number,
        event_type: 'JMR_MEASUREMENT_UPLOADED',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          jmr_id: jmrRecord._id,
          measured_area: jmrRecord.measured_area,
          land_type: jmrRecord.land_type,
          tribal_classification: jmrRecord.tribal_classification,
          village: jmrRecord.village,
          taluka: jmrRecord.taluka,
          district: jmrRecord.district
        },
        remarks: `JMR measurement uploaded for survey ${jmrRecord.survey_number}`,
        timestamp: new Date().toISOString(),
        record_data: recordData
      });
    } catch (error) {
      console.error('❌ Failed to create JMR blockchain entry:', error);
      throw error;
    }
  }

  /**
   * Create blockchain entry for landowner record
   */
  async createLandownerBlockchainEntry(landownerRecord, officerId, projectId) {
    try {
      const recordData = {
        survey_number: landownerRecord.survey_number,
        owner_name: landownerRecord.owner_name,
        owner_id: landownerRecord.owner_id,
        land_type: landownerRecord.land_type,
        area: landownerRecord.area,
        village: landownerRecord.village,
        taluka: landownerRecord.taluka,
        district: landownerRecord.district,
        created_at: landownerRecord.created_at,
        updated_at: landownerRecord.updated_at
      };

      return await this.createLedgerEntry({
        survey_number: landownerRecord.survey_number,
        event_type: 'LANDOWNER_RECORD_CREATED',
        officer_id: officerId,
        project_id: projectId,
        metadata: {
          landowner_id: landownerRecord._id,
          owner_name: landownerRecord.owner_name,
          owner_id: landownerRecord.owner_id,
          land_type: landownerRecord.land_type,
          area: landownerRecord.area,
          village: landownerRecord.village,
          taluka: landownerRecord.taluka,
          district: landownerRecord.district
        },
        remarks: `Landowner record created for survey ${landownerRecord.survey_number}`,
        timestamp: new Date().toISOString(),
        record_data: recordData
      });
    } catch (error) {
      console.error('❌ Failed to create landowner blockchain entry:', error);
      throw error;
    }
  }

  /**
   * Get survey blockchain status
   */
  async surveyExistsOnBlockchain(surveyNumber) {
    try {
      const entry = await MongoBlockchainLedger.findOne({
        survey_number,
        event_type: { $in: ['JMR_MEASUREMENT_UPLOADED', 'LANDOWNER_RECORD_CREATED'] }
      });

      return !!entry;
    } catch (error) {
      console.error('❌ Failed to check blockchain status:', error);
      return false;
    }
  }

  /**
   * Get survey integrity status
   */
  async getSurveyIntegrityStatus(surveyNumber) {
    try {
      const entries = await MongoBlockchainLedger.find({
        survey_number
      }).sort({ timestamp: 1 });

      if (entries.length === 0) {
        return {
          isIntegrityValid: false,
          lastChecked: null,
          compromiseReason: 'No blockchain entries found'
        };
      }

      // Check hash chain integrity
      let isValid = true;
      let compromiseReason = null;

      for (let i = 1; i < entries.length; i++) {
        if (entries[i].previous_hash !== entries[i - 1].current_hash) {
          isValid = false;
          compromiseReason = `Hash chain broken at entry ${i}`;
          break;
        }
      }

      return {
        isIntegrityValid: isValid,
        lastChecked: entries[entries.length - 1].timestamp,
        compromiseReason: compromiseReason || 'Integrity verified'
      };
    } catch (error) {
      console.error('❌ Failed to get integrity status:', error);
      return {
        isIntegrityValid: false,
        lastChecked: null,
        compromiseReason: 'Error checking integrity'
      };
    }
  }

  /**
   * Get survey timeline count
   */
  async getTimelineCount(surveyNumber) {
    try {
      const count = await MongoBlockchainLedger.countDocuments({
        survey_number
      });
      return count;
    } catch (error) {
      console.error('❌ Failed to get timeline count:', error);
      return 0;
    }
  }

  /**
   * Get survey timeline events
   */
  async getSurveyTimeline(surveyNumber) {
    try {
      const events = await MongoBlockchainLedger.find({
        survey_number
      }).sort({ timestamp: 1 });

      return events.map(event => ({
        id: event._id,
        event_type: event.event_type,
        timestamp: event.timestamp,
        officer_id: event.officer_id,
        metadata: event.metadata,
        remarks: event.remarks,
        block_id: event.block_id,
        current_hash: event.current_hash,
        previous_hash: event.previous_hash
      }));
    } catch (error) {
      console.error('❌ Failed to get survey timeline:', error);
      return [];
    }
  }

  /**
   * Get enhanced network status
   */
  async getEnhancedNetworkStatus() {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const network = await this.provider.getNetwork();
      const gasPrice = await this.provider.getFeeData();
      
      let walletBalance = '0';
      if (this.wallet && typeof this.wallet.getBalance === 'function') {
        try {
          const balance = await this.wallet.getBalance();
          walletBalance = ethers.formatEther(balance);
        } catch (balanceError) {
          console.warn('⚠️ Could not get wallet balance:', balanceError.message);
        }
      }

      return {
        success: true,
        data: {
          network: {
            name: network.name,
            chainId: network.chainId.toString(),
            rpcUrl: this.config.getNetworkInfo().rpcUrl,
            wsUrl: this.config.getNetworkInfo().wsUrl,
            explorer: this.config.getNetworkInfo().explorer
          },
          wallet: {
            address: this.config.getWalletInfo().address,
            balance: walletBalance,
            isConnected: !!this.wallet
          },
          contract: {
            address: this.config.getContractInfo().address,
            isDeployed: true
          },
          gas: {
            gasPrice: gasPrice.gasPrice ? ethers.formatUnits(gasPrice.gasPrice, 'gwei') : '0',
            maxFeePerGas: gasPrice.maxFeePerGas ? ethers.formatUnits(gasPrice.maxFeePerGas, 'gwei') : '0',
            maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas ? ethers.formatUnits(gasPrice.maxPriorityFeePerGas, 'gwei') : '0'
          },
          status: {
            isInitialized: this.isInitialized,
            lastProcessedBlock: this.lastProcessedBlock,
            pollingActive: !!this.pollingInterval
          }
        }
      };
    } catch (error) {
      console.error('❌ Failed to get enhanced network status:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Get surveys with blockchain status
   */
  async getSurveysWithBlockchainStatus(limit = 100) {
    try {
      const surveys = await MongoJMRRecord.find({ is_active: true })
        .limit(limit)
        .sort({ created_at: -1 });

      const surveysWithStatus = await Promise.all(
        surveys.map(async (survey) => {
          const blockchainStatus = await this.surveyExistsOnBlockchain(survey.survey_number);
          const integrityStatus = await this.getSurveyIntegrityStatus(survey.survey_number);
          const timelineCount = await this.getTimelineCount(survey.survey_number);

          return {
            ...survey.toObject(),
            blockchain_status: blockchainStatus,
            integrity_status: integrityStatus,
            timeline_count: timelineCount
          };
        })
      );

      return surveysWithStatus;
    } catch (error) {
      console.error('❌ Failed to get surveys with blockchain status:', error);
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    console.log('🧹 Enhanced blockchain service cleaned up');
  }
}

export default EnhancedBlockchainService;

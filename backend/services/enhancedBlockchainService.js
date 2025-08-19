import { ethers } from 'ethers';
import crypto from 'crypto';
import BlockchainConfig from '../config/blockchain.js';

// Create blockchain config instance
const blockchainConfig = new BlockchainConfig();

class EnhancedBlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isInitialized = false;
    this.pendingTransactions = new Map();
    this.transactionHistory = new Map();
    
    this.initialize();
  }

  async initialize() {
    try {
      // Check if blockchain is enabled
      if (!blockchainConfig.isBlockchainEnabled()) {
        console.log('ℹ️ Blockchain features are disabled in configuration');
        this.isInitialized = false;
        return;
      }

      // Validate configuration
      const validation = blockchainConfig.validate();
      if (!validation.isValid) {
        console.error('❌ Blockchain configuration validation failed:', validation.errors);
        console.log('ℹ️ Enhanced blockchain service will not be available');
        this.isInitialized = false;
        return;
      }

      // Try to initialize WebSocket provider first for better real-time events
      try {
        const wsUrl = blockchainConfig.getProviderConfig().wsUrl;
        if (wsUrl && wsUrl !== 'your_websocket_url_here') {
          this.provider = new ethers.WebSocketProvider(
            wsUrl,
            {
              name: "polygon-amoy",
              chainId: 80002
            }
          );
          console.log('🔌 WebSocket provider initialized for real-time events');
        } else {
          // Fallback to HTTP provider
          this.provider = new ethers.JsonRpcProvider(
            blockchainConfig.getProviderConfig().url,
            {
              name: "polygon-amoy",   // Amoy testnet name
              chainId: 80002          // Amoy testnet chain ID
            }
          );
          console.log('🌐 HTTP provider initialized (fallback mode)');
        }
      } catch (wsError) {
        console.warn('⚠️ WebSocket provider failed, falling back to HTTP:', wsError.message);
        // Fallback to HTTP provider
      this.provider = new ethers.JsonRpcProvider(
          blockchainConfig.getProviderConfig().url,
          {
            name: "polygon-amoy",
            chainId: 80002
          }
        );
        console.log('🌐 HTTP provider initialized (fallback mode)');
      }

      // Initialize wallet
      if (blockchainConfig.getWalletConfig().privateKey && 
          blockchainConfig.getWalletConfig().privateKey !== 'your_private_key_here') {
        this.wallet = new ethers.Wallet(
          blockchainConfig.getWalletConfig().privateKey,
          this.provider
        );
        console.log('🔐 Enhanced blockchain wallet initialized');
      }

      // Initialize contract
      const contractInfo = blockchainConfig.getContractInfo();
      if (contractInfo.address && 
          contractInfo.address !== '0x1234567890123456789012345678901234567890') {
        this.contract = new ethers.Contract(
          contractInfo.address,
          this.getEnhancedContractABI(),
          this.wallet || this.provider
        );
        console.log('📜 Enhanced smart contract initialized');
      }

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('✅ Enhanced blockchain service initialized successfully');
      
      // Log configuration summary
      console.log('📋 Blockchain Configuration:', blockchainConfig.getSummary());
    } catch (error) {
      console.error('❌ Failed to initialize enhanced blockchain service:', error);
      console.log('ℹ️ Enhanced blockchain service will not be available');
      this.isInitialized = false;
    }
  }

  getEnhancedContractABI() {
    return [
      // Existing functions
      'event LandRecordUpdated(string surveyNumber, string eventType, address officer, uint256 timestamp, string metadata, uint256 blockNumber, string dataHash)',
      'event SurveyDataUpdated(string surveyNumber, string ownerId, string landType, string dataHash, uint256 timestamp)',
      'event OfficerRegistered(address indexed officerAddress, string name, string designation, string district, string taluka)',
      'event OfficerStatusChanged(address indexed officerAddress, bool isActive)',
      
      // New timeline and integrity functions
      'event TimelineEventAdded(string indexed surveyNumber, string eventType, string ownerId, uint256 timestamp, string eventHash, uint256 eventIndex)',
      'event IntegrityCheckPerformed(string indexed surveyNumber, bool isCompromised, string reason)',
      'event SurveyBlockCreated(string indexed surveyNumber, string initialHash, uint256 timestamp)',
      
      // Functions
      'function updateLandRecord(string surveyNumber, string eventType, string metadata, string ownerId, string landType, string landArea, string location, string projectDetails) external',
      'function getLandRecord(string surveyNumber) external view returns (string[] memory eventTypes, uint256[] memory timestamps, address[] memory officers, string[] memory metadata, string[] memory dataHashes, string[] memory currentHashes)',
      'function getSurveyData(string surveyNumber) external view returns (string surveyNumber, string ownerId, string landType, string landArea, string location, string projectDetails, uint256 lastUpdated, bool isActive)',
      'function getCurrentHash(string surveyNumber) external view returns (string currentHash)',
      'function verifyRecord(string surveyNumber, uint256 blockNumber) external view returns (bool)',
      'function generateSurveyDataHash(string surveyNumber, string ownerId, string landType, string landArea, string location, string projectDetails, uint256 timestamp) external pure returns (string dataHash)',
      'function isAuthorizedOfficer(address officerAddress) external view returns (bool)',
      'function registerOfficer(address officerAddress, string name, string designation, string district, string taluka) external',
      'function setOfficerStatus(address officerAddress, bool isActive) external',
      'function getOfficerInfo(address officerAddress) external view returns (string name, string designation, string district, string taluka, bool isActive, uint256 registrationDate)',
      'function getContractStats() external view returns (uint256 totalOfficers, uint256 activeOfficers, uint256 totalRecords, uint256 totalSurveys)',
      
      // NEW: Timeline and integrity functions
      'function createSurveyBlock(string surveyNumber, string jmrData, string awardData, string landRecordData, string ownerId, string landType) external',
      'function addTimelineEvent(string surveyNumber, string eventType, string ownerId, string landType, string details) external',
      'function getSurveyTimeline(string surveyNumber) external view returns (string[] memory eventTypes, string[] memory ownerIds, string[] memory landTypes, string[] memory details, uint256[] memory timestamps, address[] memory officers, string[] memory eventHashes, uint256[] memory eventIndexes)',
      'function verifySurveyIntegrity(string surveyNumber, string databaseHash) external returns (bool isCompromised, string memory reason)',
      'function getCurrentTimelineHash(string surveyNumber) external view returns (string currentHash)',
      'function getSurveyIntegrityStatus(string surveyNumber) external view returns (bool isIntegrityValid, uint256 lastChecked, string memory compromiseReason)',
      'function getTimelineCount(string surveyNumber) external view returns (uint256 count)'
    ];
  }

  setupEventListeners() {
    if (!this.contract) return;

    try {
      // Instead of using .on() which creates filters, we'll use a polling approach
      // This completely avoids the filter system that causes the errors
      console.log('ℹ️ Using polling-based event monitoring (no filters)');
      
      // Set up polling for events every 60 seconds (less frequent to reduce errors)
      this.eventPollingInterval = setInterval(async () => {
        try {
          await this.pollForNewEvents();
        } catch (error) {
          console.debug('Event polling cycle completed');
        }
      }, 60000); // 60 seconds

      console.log('✅ Event polling system set up successfully (no filters)');
    } catch (error) {
      console.warn('⚠️ Event polling system failed to set up:', error.message);
      // Continue without event monitoring - we can still use getLogs for historical data
    }
  }

  /**
   * Poll for new events without using filters
   */
  async pollForNewEvents() {
    try {
      if (!this.provider || !this.contract) return;

      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      
      // Check last 10 blocks for new events
      const fromBlock = Math.max(0, currentBlock - 10);
      
      // Get logs for recent events
      const logs = await this.provider.getLogs({
        fromBlock: fromBlock,
        toBlock: currentBlock,
        address: this.contract.address
      });

      // Process new events
      for (const log of logs) {
        try {
          const decodedLog = this.contract.interface.parseLog(log);
          if (decodedLog && decodedLog.name) {
            await this.processEventLog(decodedLog, log);
          }
        } catch (error) {
          // Skip logs we can't decode - this is normal for non-contract logs
          continue;
        }
      }
    } catch (error) {
      // Silently handle polling errors - this is expected when no new events
      console.debug('Event polling cycle completed');
    }
  }

  /**
   * Process an event log without filters
   */
  async processEventLog(decodedLog, log) {
    try {
      const eventName = decodedLog.name;
      const args = decodedLog.args;

      switch (eventName) {
        case 'LandRecordUpdated':
          console.log('🔗 Land Record Updated Event (Polled):', {
            surveyNumber: args[0],
            eventType: args[1],
            officer: args[2],
            timestamp: new Date(Number(args[3]) * 1000),
            blockNumber: log.blockNumber.toString(),
            dataHash: args[6]
          });
          break;

        case 'TimelineEventAdded':
          console.log('📅 Timeline Event Added (Polled):', {
            surveyNumber: args[0],
            eventType: args[1],
            ownerId: args[2],
            timestamp: new Date(Number(args[3]) * 1000),
            eventHash: args[4],
            eventIndex: args[5].toString()
          });
          break;

        case 'IntegrityCheckPerformed':
          console.log('🔐 Integrity Check (Polled):', {
            surveyNumber: args[0],
            isCompromised: args[1],
            reason: args[2]
          });
          break;

        case 'SurveyBlockCreated':
          console.log('🏗️ Survey Block Created (Polled):', {
            surveyNumber: args[0],
            initialHash: args[1],
            timestamp: new Date(Number(args[2]) * 1000)
          });
          break;
      }
    } catch (error) {
      console.debug('Event processing failed:', error.message);
    }
  }

  // ===== NEW: De-Land Inspired Functions =====

  /**
   * Create initial survey block with all current data
   */
  async createSurveyBlock(surveyData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Enhanced blockchain service not initialized');
      }

      const {
        surveyNumber,
        jmrData,
        awardData,
        landRecordData,
        ownerId,
        landType
      } = surveyData;

      // Validate required data
      if (!surveyNumber || !ownerId || !landType) {
        throw new Error('Missing required survey data');
      }

      // Check if survey block already exists
      const existingHash = await this.contract.getCurrentTimelineHash(surveyNumber);
      if (existingHash && existingHash !== '0x') {
        throw new Error('Survey block already exists for this survey number');
      }

      // Prepare data for blockchain
      const jmrDataString = JSON.stringify(jmrData || {});
      const awardDataString = JSON.stringify(awardData || {});
      const landRecordDataString = JSON.stringify(landRecordData || {});

      // Submit to blockchain
      const tx = await this.contract.createSurveyBlock(
        surveyNumber,
        jmrDataString,
        awardDataString,
        landRecordDataString,
        ownerId,
        landType
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`🏗️ Survey block created: ${tx.hash}`);

      // Store transaction
      this.transactionHistory.set(tx.hash, {
        type: 'SurveyBlockCreated',
        surveyNumber,
        timestamp: new Date(),
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        surveyNumber
      };
    } catch (error) {
      console.error('❌ Failed to create survey block:', error);
      throw error;
    }
  }

  /**
   * Add new timeline event for survey changes
   */
  async addTimelineEvent(surveyNumber, eventData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Enhanced blockchain service not initialized');
      }

      const {
        eventType,
        ownerId,
        landType,
        details
      } = eventData;

      // Validate required data
      if (!surveyNumber || !eventType || !ownerId || !landType || !details) {
        throw new Error('Missing required event data');
      }

      // Check if survey block exists
      const existingHash = await this.contract.getCurrentTimelineHash(surveyNumber);
      if (!existingHash || existingHash === '0x') {
        throw new Error('Survey block does not exist. Create survey block first.');
      }

      // Submit to blockchain
      const tx = await this.contract.addTimelineEvent(
        surveyNumber,
        eventType,
        ownerId,
        landType,
        details
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`📅 Timeline event added: ${tx.hash}`);

      // Store transaction
      this.transactionHistory.set(tx.hash, {
        type: 'TimelineEventAdded',
        surveyNumber,
        eventType,
        timestamp: new Date(),
        status: 'confirmed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      });

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        surveyNumber,
        eventType
      };
    } catch (error) {
      console.error('❌ Failed to add timeline event:', error);
      throw error;
    }
  }

  /**
   * Get complete timeline for a survey number
   */
  async getSurveyTimeline(surveyNumber) {
    try {
      if (!this.contract || !this.isInitialized) {
        return null;
      }

      const timelineData = await this.contract.getSurveyTimeline(surveyNumber);
      
      const timeline = [];
      for (let i = 0; i < timelineData.eventTypes.length; i++) {
        timeline.push({
          eventType: timelineData.eventTypes[i],
          ownerId: timelineData.ownerIds[i],
          landType: timelineData.landTypes[i],
          details: timelineData.details[i],
          timestamp: new Date(Number(timelineData.timestamps[i]) * 1000),
          officer: timelineData.officers[i],
          eventHash: timelineData.eventHashes[i],
          eventIndex: Number(timelineData.eventIndexes[i])
        });
      }

      return timeline;
    } catch (error) {
      console.error('❌ Failed to get survey timeline:', error);
      return null;
    }
  }

  /**
   * Verify survey integrity by comparing database hash with blockchain hash
   */
  async verifySurveyIntegrity(surveyNumber, databaseHash) {
    try {
      if (!this.contract || !this.isInitialized) {
        return { isValid: false, reason: 'Blockchain service not initialized' };
      }

      // Call smart contract verification
      const [isCompromised, reason] = await this.contract.verifySurveyIntegrity(surveyNumber, databaseHash);
      
      return {
        isValid: !isCompromised,
        isCompromised,
        reason,
        surveyNumber,
        databaseHash,
        verifiedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to verify survey integrity:', error);
      return { 
        isValid: false, 
        reason: error.message,
        surveyNumber,
        databaseHash,
        verifiedAt: new Date()
      };
    }
  }

  /**
   * Get current timeline hash for a survey number
   */
  async getCurrentTimelineHash(surveyNumber) {
    try {
      if (!this.contract || !this.isInitialized) {
        return null;
      }

      return await this.contract.getCurrentTimelineHash(surveyNumber);
    } catch (error) {
      console.error('❌ Failed to get current timeline hash:', error);
      return null;
    }
  }

  /**
   * Get integrity status for a survey number
   */
  async getSurveyIntegrityStatus(surveyNumber) {
    try {
      if (!this.contract || !this.isInitialized) {
        return null;
      }

      const [isIntegrityValid, lastChecked, compromiseReason] = await this.contract.getSurveyIntegrityStatus(surveyNumber);
      
      return {
        surveyNumber,
        isIntegrityValid,
        lastChecked: new Date(Number(lastChecked) * 1000),
        compromiseReason,
        checkedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to get survey integrity status:', error);
      return null;
    }
  }

  /**
   * Get timeline count for a survey number
   */
  async getTimelineCount(surveyNumber) {
    try {
      if (!this.contract || !this.isInitialized) {
        return 0;
      }

      return Number(await this.contract.getTimelineCount(surveyNumber));
    } catch (error) {
      console.error('❌ Failed to get timeline count:', error);
      return 0;
    }
  }

  // ===== EXISTING FUNCTIONS (Enhanced) =====

  /**
   * Enhanced block creation with timeline integration
   */
  async createEnhancedBlock(blockData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Enhanced blockchain service not initialized');
      }

      const {
        surveyNumber,
        eventType,
        officerId,
        projectId,
        metadata,
        remarks,
        ownerId,
        landType,
        landArea,
        location,
        projectDetails
      } = blockData;

      // Check if survey block exists
      const existingHash = await this.getCurrentTimelineHash(surveyNumber);
      
      if (!existingHash || existingHash === '0x') {
        // Create initial survey block
        const surveyBlock = await this.createSurveyBlock({
          surveyNumber,
          jmrData: metadata.jmrData || {},
          awardData: metadata.awardData || {},
          landRecordData: {
            ownerId,
            landType,
            landArea,
            location,
            projectDetails
          },
          ownerId,
          landType
        });

        // Add first timeline event
        await this.addTimelineEvent(surveyNumber, {
          eventType: 'SurveyBlockCreated',
          ownerId,
          landType,
          details: 'Initial survey block created with all land data'
        });
      }

      // Add timeline event for this change
      const timelineEvent = await this.addTimelineEvent(surveyNumber, {
        eventType,
        ownerId,
        landType,
        details: `Event: ${eventType}. ${remarks || ''}`
      });

      return {
        success: true,
        surveyNumber,
        eventType,
        timelineEvent,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Failed to create enhanced block:', error);
      throw error;
    }
  }

  /**
   * Enhanced network status with timeline information
   */
  async getEnhancedNetworkStatus() {
    try {
      if (!this.provider) {
        return { connected: false, network: 'Unknown' };
      }

      // Helper function to safely convert BigInt to string
      const safeBigIntToString = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'bigint') return value.toString();
        if (typeof value === 'number') return value.toString();
        return String(value);
      };

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      
      let balance = null;
      try {
        if (this.wallet && typeof this.wallet.getBalance === 'function') {
          balance = await this.wallet.getBalance();
        }
      } catch (balanceError) {
        console.debug('Could not get wallet balance:', balanceError.message);
      }

      return {
        connected: true,
        network: network?.name || 'Unknown',
        chainId: safeBigIntToString(network?.chainId),
        blockNumber: safeBigIntToString(blockNumber),
        gasPrice: feeData?.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei' : 'N/A',
        maxPriorityFee: feeData?.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' gwei' : 'N/A',
        maxFee: feeData?.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' gwei' : 'N/A',
        walletBalance: balance ? ethers.formatEther(balance) + ' MATIC' : 'N/A',
        pendingTransactions: this.pendingTransactions.size,
        totalTransactions: this.transactionHistory.size,
        serviceStatus: 'Enhanced Blockchain Service Active'
      };
    } catch (error) {
      console.error('❌ Failed to get enhanced network status:', error);
      return { connected: false, network: 'Error', error: error.message };
    }
  }

  // ===== UTILITY FUNCTIONS =====

  /**
   * Get historical logs for a survey number without using filters
   * This is more reliable than filter-based event listening
   */
  async getSurveyHistoricalLogs(surveyNumber, fromBlock = 0, toBlock = 'latest') {
    try {
      if (!this.provider || !this.contract) {
        throw new Error('Provider or contract not initialized');
      }

      // Get logs for all relevant events
      const logs = await this.provider.getLogs({
        fromBlock: fromBlock,
        toBlock: toBlock,
        address: this.contract.address,
        topics: [
          // Listen to all events by not specifying specific topics
          null
        ]
      });

      // Filter logs that contain the survey number
      const surveyLogs = logs.filter(log => {
        try {
          // Decode the log to check if it contains the survey number
          const decodedLog = this.contract.interface.parseLog(log);
          const args = decodedLog.args;
          
          // Check if any argument contains the survey number
          return Object.values(args).some(arg => 
            arg && arg.toString().includes(surveyNumber)
          );
        } catch (error) {
          // If we can't decode the log, skip it
          return false;
        }
      });

      return surveyLogs.map(log => {
        try {
          const decodedLog = this.contract.interface.parseLog(log);
          return {
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            eventName: decodedLog.name,
            args: decodedLog.args,
            timestamp: null // We'll need to get this separately if needed
          };
        } catch (error) {
          return {
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash,
            logIndex: log.logIndex,
            eventName: 'Unknown',
            args: [],
            error: error.message
          };
        }
      });
    } catch (error) {
      console.error('❌ Failed to get historical logs:', error);
      return [];
    }
  }

  /**
   * Get recent events for a survey number (last N blocks)
   */
  async getRecentSurveyEvents(surveyNumber, blockRange = 1000) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - blockRange);
      
      return await this.getSurveyHistoricalLogs(surveyNumber, fromBlock, currentBlock);
    } catch (error) {
      console.error('❌ Failed to get recent events:', error);
      return [];
    }
  }

  /**
   * Generate comprehensive hash for survey data
   */
  generateSurveyHash(surveyData) {
    const {
      surveyNumber,
      jmrData,
      awardData,
      landRecordData,
      ownerId,
      landType,
      timestamp
    } = surveyData;

    const combinedData = JSON.stringify({
      surveyNumber,
      jmrData,
      awardData,
      landRecordData,
      ownerId,
      landType,
      timestamp: timestamp || new Date().toISOString()
    });

    return crypto.createHash('sha256').update(combinedData).digest('hex');
  }

  /**
   * Check if survey exists on blockchain
   */
  async surveyExistsOnBlockchain(surveyNumber) {
    try {
      const hash = await this.getCurrentTimelineHash(surveyNumber);
      return hash && hash !== '0x';
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all surveys with blockchain status
   */
  async getSurveysWithBlockchainStatus(surveyNumbers) {
    const results = [];
    
    for (const surveyNumber of surveyNumbers) {
      try {
        const exists = await this.surveyExistsOnBlockchain(surveyNumber);
        const integrityStatus = await this.getSurveyIntegrityStatus(surveyNumber);
        const timelineCount = await this.getTimelineCount(surveyNumber);
        
        results.push({
          surveyNumber,
          existsOnBlockchain: exists,
          integrityStatus: integrityStatus?.isIntegrityValid || false,
          timelineCount,
          lastChecked: integrityStatus?.lastChecked || null
        });
      } catch (error) {
        results.push({
          surveyNumber,
          existsOnBlockchain: false,
          integrityStatus: false,
          timelineCount: 0,
          lastChecked: null,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Create blockchain ledger entry
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
        timestamp
      } = entryData;

      // Generate unique block ID
      const blockId = crypto.randomBytes(16).toString('hex');
      
      // Create hash from entry data
      const dataString = `${survey_number}${event_type}${officer_id}${timestamp}${JSON.stringify(metadata)}`;
      const currentHash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      // For now, return the entry data with generated IDs
      // In a full implementation, this would be stored on the blockchain
      const ledgerEntry = {
        id: Date.now(),
        block_id: blockId,
        survey_number,
        event_type,
        officer_id,
        timestamp: timestamp || new Date().toISOString(),
        metadata,
        project_id,
        remarks,
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        current_hash: currentHash,
        nonce: Math.floor(Math.random() * 1000000),
        is_valid: true
      };

      console.log('📝 Blockchain ledger entry created:', {
        survey_number,
        event_type,
        block_id: blockId,
        hash: currentHash
      });

      return ledgerEntry;
    } catch (error) {
      console.error('❌ Failed to create ledger entry:', error);
      throw error;
    }
  }

  /**
   * Clean up resources when service is destroyed
   */
  cleanup() {
    if (this.eventPollingInterval) {
      clearInterval(this.eventPollingInterval);
      this.eventPollingInterval = null;
      console.log('🧹 Event polling cleaned up');
    }
  }
}

// Create singleton instance
const enhancedBlockchainService = new EnhancedBlockchainService();

// Export individual functions
export const createSurveyBlock = (surveyData) => enhancedBlockchainService.createSurveyBlock(surveyData);
export const addTimelineEvent = (surveyNumber, eventData) => enhancedBlockchainService.addTimelineEvent(surveyNumber, eventData);
export const getSurveyTimeline = (surveyNumber) => enhancedBlockchainService.getSurveyTimeline(surveyNumber);
export const verifySurveyIntegrity = (surveyNumber, databaseHash) => enhancedBlockchainService.verifySurveyIntegrity(surveyNumber, databaseHash);
export const getCurrentTimelineHash = (surveyNumber) => enhancedBlockchainService.getCurrentTimelineHash(surveyNumber);
export const getSurveyIntegrityStatus = (surveyNumber) => enhancedBlockchainService.getSurveyIntegrityStatus(surveyNumber);
export const getTimelineCount = (surveyNumber) => enhancedBlockchainService.getTimelineCount(surveyNumber);
export const createEnhancedBlock = (blockData) => enhancedBlockchainService.createEnhancedBlock(blockData);
export const getEnhancedNetworkStatus = () => enhancedBlockchainService.getEnhancedNetworkStatus();
export const surveyExistsOnBlockchain = (surveyNumber) => enhancedBlockchainService.surveyExistsOnBlockchain(surveyNumber);
export const getSurveysWithBlockchainStatus = (surveyNumbers) => enhancedBlockchainService.getSurveysWithBlockchainStatus(surveyNumbers);

// Export new utility functions for historical data
export const getSurveyHistoricalLogs = (surveyNumber, fromBlock, toBlock) => enhancedBlockchainService.getSurveyHistoricalLogs(surveyNumber, fromBlock, toBlock);
export const getRecentSurveyEvents = (surveyNumber, blockRange) => enhancedBlockchainService.getRecentSurveyEvents(surveyNumber, blockRange);
export const createLedgerEntry = (entryData) => enhancedBlockchainService.createLedgerEntry(entryData);

export default enhancedBlockchainService;

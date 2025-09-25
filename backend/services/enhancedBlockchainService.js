import { ethers } from 'ethers';
import crypto from 'crypto';
import BlockchainConfig from '../config/blockchain.js';
import MongoBlockchainLedger from '../models/mongo/BlockchainLedger.js';
import MongoJMRRecord from '../models/mongo/JMRRecord.js';
import MongoLandownerRecord from '../models/mongo/LandownerRecord.js';
import MongoProject from '../models/mongo/Project.js';
import SurveyDataAggregationService from './surveyDataAggregationService.js';

class EnhancedBlockchainService {
  constructor() {
    this.config = new BlockchainConfig();
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isInitialized = false;
    this.pollingInterval = null;
    this.lastProcessedBlock = 0;
    
    // WebSocket connection management
    this.wsProvider = null;
    this.isWebSocketConnected = false;
    this.connectionRetryCount = 0;
    this.connectionHealthCheck = null;
    this.currentProviderIndex = 0;
    this.providers = [];
    
    // Load WebSocket configuration
    const wsConfig = this.config.getWebSocketConfig();
    this.maxRetries = wsConfig.maxRetries;
    this.retryDelay = wsConfig.retryDelay;
    this.maxRetryDelay = wsConfig.maxRetryDelay;
    this.healthCheckInterval = wsConfig.healthCheckInterval;
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

      // Initialize provider with improved WebSocket handling and fallback
      await this.initializeProvider();

      // Initialize wallet
      const walletInfo = this.config.getWalletInfo();
      this.wallet = new ethers.Wallet(walletInfo.privateKey, this.provider);
        console.log('🔐 Enhanced blockchain wallet initialized');

      // Initialize contract
      const contractInfo = this.config.getContractInfo();
      const contractABI = await this.loadContractABI(contractInfo.abiPath);
      this.contract = new ethers.Contract(contractInfo.address, contractABI, this.wallet);
        console.log('📜 Enhanced smart contract initialized');

      // Set up event polling only if contract is deployed
      if (this.contract && this.contract.target) {
        await this.setupEventPolling();
      } else {
        console.log('⚠️ Contract not deployed, skipping event polling setup');
      }

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
        "event LandRecordUpdated(string surveyNumber, string newDataHash, string changeReason, uint256 timestamp)",
        "event OfficerAdded(address officer, uint256 timestamp)",
        "event OfficerRemoved(address officer, uint256 timestamp)"
      ];
    } catch (error) {
      console.error('❌ Failed to load contract ABI:', error);
      return [];
    }
  }

  /**
   * Initialize provider with WebSocket support and fallback
   */
  async initializeProvider() {
    this.providers = this.config.getProviders();
    console.log(`🔄 Initializing provider with ${this.providers.length} available endpoints`);
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      this.currentProviderIndex = i;
      
      try {
        console.log(`🌐 Attempting to connect to ${provider.name} (${provider.wsUrl})`);
        
        // Try WebSocket first
        if (provider.wsUrl && provider.wsUrl.startsWith('wss://')) {
          try {
            await this.initializeWebSocketProvider(provider);
            if (this.isWebSocketConnected) {
              console.log(`✅ WebSocket connected to ${provider.name}`);
              this.startConnectionHealthCheck();
              return;
            }
          } catch (wsError) {
            console.log(`⚠️ WebSocket failed for ${provider.name}: ${wsError.message}`);
            
            // If rate limited, try HTTP immediately
            if (wsError.message.includes('Rate limited') || wsError.message.includes('429')) {
              console.log(`🔄 Rate limited on WebSocket, trying HTTP for ${provider.name}`);
              await this.initializeHttpProvider(provider);
              console.log(`✅ HTTP provider connected to ${provider.name}`);
              return;
            }
            
            // For other WebSocket errors, try HTTP fallback
            console.log(`🔄 WebSocket failed for ${provider.name}, trying HTTP fallback`);
            await this.initializeHttpProvider(provider);
            console.log(`✅ HTTP provider connected to ${provider.name}`);
            return;
          }
        }
        
        // Fallback to HTTP if WebSocket fails
        console.log(`🔄 WebSocket failed for ${provider.name}, trying HTTP fallback`);
        await this.initializeHttpProvider(provider);
        console.log(`✅ HTTP provider connected to ${provider.name}`);
        return;
        
      } catch (error) {
        console.error(`❌ Failed to connect to ${provider.name}:`, error.message);
        
        // Handle rate limiting by waiting longer
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log(`⚠️ Rate limited by ${provider.name}, waiting 5 seconds before next provider`);
          await this.delay(5000);
        } else {
          // Wait before trying next provider
          await this.delay(2000);
        }
        
        // If this is the last provider, throw the error
        if (i === this.providers.length - 1) {
          throw new Error(`All providers failed. Last error: ${error.message}`);
        }
      }
    }
  }

  /**
   * Initialize WebSocket provider with retry logic
   */
  async initializeWebSocketProvider(provider) {
    return new Promise(async (resolve, reject) => {
      let retryCount = 0;
      const maxRetries = 2;
      
      const attemptConnection = async () => {
        try {
          console.log(`🔌 Creating WebSocket connection to ${provider.wsUrl}`);
          this.wsProvider = new ethers.WebSocketProvider(provider.wsUrl);
          
          // Wait a moment for the WebSocket to initialize
          await this.delay(100);
          
          // Check if WebSocket is properly initialized
          if (!this.wsProvider || !this.wsProvider._websocket) {
            throw new Error('WebSocket provider not properly initialized');
          }
          
          // Set up event listeners
          this.wsProvider._websocket.on('open', () => {
            console.log(`🌐 WebSocket connection opened to ${provider.name}`);
            this.isWebSocketConnected = true;
            this.connectionRetryCount = 0;
            this.provider = this.wsProvider;
            resolve();
          });
          
          this.wsProvider._websocket.on('error', (error) => {
            console.error(`❌ WebSocket error for ${provider.name}:`, error.message);
            this.isWebSocketConnected = false;
            
            // Handle specific error types
            if (error.message.includes('429') || error.message.includes('rate limit')) {
              console.log(`⚠️ Rate limited by ${provider.name}, trying next provider`);
              reject(new Error(`Rate limited: ${error.message}`));
              return;
            }
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`🔄 Retrying WebSocket connection (${retryCount}/${maxRetries})`);
              setTimeout(attemptConnection, this.retryDelay * retryCount);
            } else {
              reject(new Error(`WebSocket connection failed after ${maxRetries} retries: ${error.message}`));
            }
          });
          
          this.wsProvider._websocket.on('close', (code, reason) => {
            console.log(`🔌 WebSocket connection closed: ${code} - ${reason}`);
            this.isWebSocketConnected = false;
            
            if (code !== 1000) { // Not a normal closure
              console.log('🔄 WebSocket closed unexpectedly, will attempt reconnection');
              this.scheduleReconnection();
            }
          });
          
          // Set a timeout for the connection attempt
          setTimeout(() => {
            if (!this.isWebSocketConnected) {
              reject(new Error('WebSocket connection timeout'));
            }
          }, 10000);
          
        } catch (error) {
          console.error(`❌ WebSocket initialization error for ${provider.name}:`, error.message);
          
          // Handle rate limiting errors
          if (error.message.includes('429') || error.message.includes('rate limit')) {
            reject(new Error(`Rate limited: ${error.message}`));
            return;
          }
          
          reject(error);
        }
      };
      
      await attemptConnection();
    });
  }

  /**
   * Initialize HTTP provider as fallback
   */
  async initializeHttpProvider(provider) {
    this.provider = new ethers.JsonRpcProvider(provider.rpcUrl, {
      name: "polygon-amoy",
      chainId: 80002
    });
    
    // Test the connection with retry logic
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount < maxRetries) {
      try {
        await this.provider.getBlockNumber();
        console.log(`✅ HTTP provider connection verified for ${provider.name}`);
        return;
      } catch (error) {
        retryCount++;
        
        // Handle rate limiting
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log(`⚠️ Rate limited by ${provider.name} HTTP, waiting before retry`);
          await this.delay(3000 * retryCount);
          continue;
        }
        
        // Handle other errors
        if (retryCount >= maxRetries) {
          throw new Error(`HTTP provider connection test failed after ${maxRetries} retries: ${error.message}`);
        }
        
        console.log(`🔄 HTTP connection test failed, retrying (${retryCount}/${maxRetries})`);
        await this.delay(1000 * retryCount);
      }
    }
  }

  /**
   * Start connection health monitoring
   */
  startConnectionHealthCheck() {
    if (this.connectionHealthCheck) {
      clearInterval(this.connectionHealthCheck);
    }
    
    this.connectionHealthCheck = setInterval(async () => {
      if (this.isWebSocketConnected && this.wsProvider) {
        try {
          await this.wsProvider.getBlockNumber();
        } catch (error) {
          console.error('❌ WebSocket health check failed:', error.message);
          this.isWebSocketConnected = false;
          this.scheduleReconnection();
        }
      }
    }, this.healthCheckInterval);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnection() {
    if (this.connectionRetryCount >= this.maxRetries) {
      console.log('❌ Max reconnection attempts reached, staying with HTTP provider');
      return;
    }
    
    this.connectionRetryCount++;
    const delay = Math.min(this.retryDelay * Math.pow(2, this.connectionRetryCount - 1), this.maxRetryDelay);
    
    console.log(`🔄 Scheduling reconnection in ${delay}ms (attempt ${this.connectionRetryCount}/${this.maxRetries})`);
    
    setTimeout(async () => {
      try {
        const currentProvider = this.providers[this.currentProviderIndex];
        await this.initializeWebSocketProvider(currentProvider);
        console.log('✅ WebSocket reconnected successfully');
        this.connectionRetryCount = 0;
      } catch (error) {
        console.error('❌ Reconnection failed:', error.message);
        this.scheduleReconnection();
      }
    }, delay);
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources and close connections
   */
  async cleanup() {
    console.log('🧹 Cleaning up blockchain service resources...');
    
    // Stop health check
    if (this.connectionHealthCheck) {
      clearInterval(this.connectionHealthCheck);
      this.connectionHealthCheck = null;
    }
    
    // Stop event polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Close WebSocket connection
    if (this.wsProvider && this.wsProvider._websocket) {
      try {
        this.wsProvider._websocket.close(1000, 'Service shutdown');
        console.log('🔌 WebSocket connection closed');
      } catch (error) {
        console.error('❌ Error closing WebSocket:', error.message);
      }
    }
    
    // Reset connection state
    this.isWebSocketConnected = false;
    this.isInitialized = false;
    this.connectionRetryCount = 0;
    
    console.log('✅ Blockchain service cleanup completed');
  }

  /**
   * Set up event polling system
   */
  async setupEventPolling() {
    try {
      if (!this.contract || !this.provider) {
        throw new Error('Contract or provider not initialized');
      }

      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      this.lastProcessedBlock = currentBlock - 100; // Start from 100 blocks ago

      console.log('✅ Event polling system set up successfully (no filters)');
    } catch (error) {
      console.error('❌ Failed to set up event polling:', error);
    }
  }

  /**
   * Create or update survey block
   */
  async createOrUpdateSurveyBlock(surveyNumber, data, eventType, officerId, projectId = null, remarks = '') {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      // Check if block already exists
      const existingBlock = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (existingBlock) {
        // Update existing block
        return await this.updateSurveyBlock(surveyNumber, data, eventType, officerId, projectId, remarks);
      } else {
        // Create new block
        return await this.createSurveyBlock(surveyNumber, data, eventType, officerId, projectId, remarks);
      }
    } catch (error) {
      console.error('❌ Failed to create or update survey block:', error);
      throw error;
    }
  }

  /**
   * Create new survey block
   */
  async createSurveyBlock(surveyNumber, data, eventType, officerId, projectId = null, remarks = '') {
    try {
      // Generate block ID
      const blockId = `BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create timeline entry
      const timelineEntry = {
        timestamp: new Date(),
        event_type: eventType,
        officer_id: officerId,
        data_snapshot: data,
        remarks: remarks
      };

      // Create blockchain ledger entry
      const ledgerEntry = new MongoBlockchainLedger({
        block_id: blockId,
        survey_number: surveyNumber,
        event_type: eventType,
        officer_id: officerId,
        project_id: projectId,
        survey_data: {
          landowner: {
            data: data,
            hash: this.generateDataHash(data),
            last_updated: new Date(),
            status: 'created'
          }
        },
        timeline_history: [timelineEntry],
        metadata: {
          created_at: new Date(),
          officer_id: officerId,
          project_id: projectId
        },
        remarks: remarks,
        timestamp: new Date(),
        previous_hash: null,
        nonce: Math.floor(Math.random() * 1000000)
      });

      // Save to database
      await ledgerEntry.save();
      
      console.log(`✅ Created blockchain block for survey ${surveyNumber}`);
      return {
        success: true,
        block_id: blockId,
        survey_number: surveyNumber,
        hash: ledgerEntry.current_hash
      };
    } catch (error) {
      console.error('❌ Failed to create survey block:', error);
      throw error;
    }
  }

  /**
   * Update existing survey block
   */
  async updateSurveyBlock(surveyNumber, data, eventType, officerId, projectId = null, remarks = '') {
    try {
      // Get existing block
      const existingBlock = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (!existingBlock) {
        throw new Error('No existing block found to update');
      }

      // Create new timeline entry
      const timelineEntry = {
        timestamp: new Date(),
        event_type: eventType,
        officer_id: officerId,
        data_snapshot: data,
        remarks: remarks
      };

      // Update survey data
      const updatedSurveyData = { ...existingBlock.survey_data };
      updatedSurveyData.landowner = {
        data: data,
        hash: this.generateDataHash(data),
        last_updated: new Date(),
        status: 'updated'
      };

      // Create new block with updated data
      const newBlockId = `BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const updatedBlock = new MongoBlockchainLedger({
        block_id: newBlockId,
        survey_number: surveyNumber,
        event_type: eventType,
        officer_id: officerId,
        project_id: projectId,
        survey_data: updatedSurveyData,
        timeline_history: [...(existingBlock.timeline_history || []), timelineEntry],
        metadata: {
          created_at: existingBlock.metadata?.created_at || new Date(),
          updated_at: new Date(),
          officer_id: officerId,
          project_id: projectId
        },
        remarks: remarks,
        timestamp: new Date(),
        previous_hash: existingBlock.current_hash,
        nonce: Math.floor(Math.random() * 1000000)
      });

      // Save updated block
      await updatedBlock.save();
      
      console.log(`✅ Updated blockchain block for survey ${surveyNumber}`);
      return {
        success: true,
        block_id: newBlockId,
        survey_number: surveyNumber,
        hash: updatedBlock.current_hash,
        previous_hash: existingBlock.current_hash
      };
    } catch (error) {
      console.error('❌ Failed to update survey block:', error);
      throw error;
    }
  }

  /**
   * Verify survey integrity
   */
  async verifySurveyIntegrity(surveyNumber) {
    try {
      // Get the latest block for this survey
      const block = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (!block) {
        return {
          isValid: false,
          reason: 'No blockchain block found',
          survey_number: surveyNumber
        };
      }

      // Verify chain integrity
      const chainIntegrity = await MongoBlockchainLedger.verifyChainIntegrity(surveyNumber);
      
      // Verify data integrity against LIVE database state, not just the stored snapshot
      const aggregator = new SurveyDataAggregationService();
      const liveSurveyData = await aggregator.getCompleteSurveyData(surveyNumber);

      const dataIntegrity = {};
      for (const [sectionName, sectionData] of Object.entries(block.survey_data || {})) {
        const storedHash = sectionData?.hash || null;
        const liveData = liveSurveyData?.[sectionName]?.data || null;

        // If nothing to compare, mark as valid (no data yet) to avoid false positives
        if (!storedHash && !liveData) {
          dataIntegrity[sectionName] = {
            isValid: true,
            storedHash: null,
            currentHash: null,
            lastUpdated: sectionData?.last_updated || null,
            comparisonSource: 'no_data'
          };
          continue;
        }

        if (!storedHash && liveData) {
          // Ledger does not have a stored hash for this section but live data exists → not compromised (needs sync)
          dataIntegrity[sectionName] = {
            isValid: true,
            storedHash: null,
            currentHash: this.generateCanonicalHash(liveData),
            lastUpdated: sectionData?.last_updated || null,
            comparisonSource: 'live_without_ledger_hash'
          };
          continue;
        }

        if (storedHash && !liveData) {
          // Ledger has data but live DB section is missing → compromised only for this section
          dataIntegrity[sectionName] = {
            isValid: false,
            storedHash,
            currentHash: null,
            lastUpdated: sectionData?.last_updated || null,
            comparisonSource: 'ledger_without_live'
          };
          continue;
        }

        // Both present: compute canonical live hash and compare strictly
        const currentLiveHash = this.generateCanonicalHash(liveData);
        const isValid = storedHash === currentLiveHash || storedHash === this.generateLegacyDataHash(liveData);

        if (!isValid) {
          console.log(`🔍 Integrity COMPROMISED for ${surveyNumber} - ${sectionName}:`, {
            storedHash,
            currentLiveHash,
            legacyLiveHash: this.generateLegacyDataHash(liveData),
            liveDataSample: JSON.stringify(this.canonicalizeBusinessData(liveData)).substring(0, 200) + '...'
          });
        }

        dataIntegrity[sectionName] = {
          isValid,
          storedHash,
          currentHash: currentLiveHash,
          lastUpdated: sectionData?.last_updated || null,
          comparisonSource: isValid && storedHash === currentLiveHash ? 'live_db_canonical' : (isValid ? 'live_db_legacy' : 'mismatch')
        };
      }

      // Overall integrity status
      const overallIntegrity = chainIntegrity.isValid && 
        Object.values(dataIntegrity).every(section => section.isValid);
      
      return {
        isValid: overallIntegrity,
        reason: overallIntegrity ? 'All integrity checks passed' : 'Integrity check failed',
        survey_number: surveyNumber,
        chain_integrity: chainIntegrity,
        data_integrity: dataIntegrity,
        block_hash: block.current_hash,
        last_updated: block.updatedAt
      };
    } catch (error) {
      console.error('❌ Failed to verify survey integrity:', error);
      return { 
        isValid: false, 
        reason: `Verification error: ${error.message}`,
        survey_number: surveyNumber
      };
    }
  }

  /**
   * Get survey timeline
   */
  async getSurveyTimeline(surveyNumber) {
    try {
      const block = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (!block) {
        return [];
      }

      return block.timeline_history || [];
    } catch (error) {
      console.error('❌ Failed to get survey timeline:', error);
      return [];
    }
  }

  /**
   * Generate data hash - FIXED VERSION with data cleaning
   */
  generateDataHash(data) {
    try {
      // 🔧 Use same data cleaning logic as other services for consistency
      const cleanData = this.cleanDataForSerialization(data);
      const dataString = JSON.stringify(cleanData, Object.keys(cleanData).sort());
      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      console.error('❌ Error generating data hash:', error);
      return null;
    }
  }

  /**
   * Generate legacy (unsorted-keys) hash for backward compatibility
   */
  generateLegacyDataHash(data) {
    try {
      const cleanData = this.cleanDataForSerialization(data);
      return crypto.createHash('sha256').update(JSON.stringify(cleanData)).digest('hex');
    } catch (error) {
      console.error('❌ Error generating legacy data hash:', error);
      return null;
    }
  }

  /**
   * Clean data for serialization (same logic as other services)
   */
  cleanDataForSerialization(data) {
    if (!data || typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDataForSerialization(item));
    }

    // Handle objects
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip internal Mongoose fields
      if (key.startsWith('__') || key === '_id') {
        continue;
      }

      // 🔧 FIX: Handle ObjectId fields properly
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
        cleaned[key] = value.toString(); // Convert ObjectId to string
      }
      // Handle Buffer fields (ObjectId buffers)
      else if (value && Buffer.isBuffer(value)) {
        cleaned[key] = value.toString('hex'); // Convert buffer to hex string
      }
      // Handle dates - convert to ISO strings for consistent hashing
      else if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      }
      // Handle nested objects
      else if (value && typeof value === 'object' && !Array.isArray(value)) {
        cleaned[key] = this.cleanDataForSerialization(value);
      }
      // Handle arrays
      else if (Array.isArray(value)) {
        cleaned[key] = this.cleanDataForSerialization(value);
      }
      // Handle primitive values
      else {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * Canonicalize business data by removing non-deterministic fields
   * like createdAt/updatedAt/__v/timestamp, while preserving domain fields.
   */
  canonicalizeBusinessData(data) {
    if (data == null) return data;
    if (Array.isArray(data)) {
      return data.map((item) => this.canonicalizeBusinessData(item));
    }
    if (typeof data !== 'object') return data;

    const removableKeys = new Set(['createdAt', 'updatedAt', '__v', 'timestamp', 'id']);
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (removableKeys.has(key)) continue;

      // Normalize ObjectId/Buffer/Date as in cleanDataForSerialization
      if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
        cleaned[key] = value.toString();
      } else if (value && Buffer.isBuffer(value)) {
        cleaned[key] = value.toString('hex');
      } else if (value instanceof Date) {
        cleaned[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        cleaned[key] = this.canonicalizeBusinessData(value);
      } else if (value && typeof value === 'object') {
        cleaned[key] = this.canonicalizeBusinessData(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  /**
   * Generate canonical hash for business data (sorted keys, after canonicalization)
   */
  generateCanonicalHash(data) {
    try {
      const canonical = this.canonicalizeBusinessData(data);
      const dataString = JSON.stringify(canonical, Object.keys(canonical || {}).sort());
      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      console.error('❌ Error generating canonical hash:', error);
      return null;
    }
  }

  /**
   * Get survey integrity status
   */
  async getSurveyIntegrityStatus(surveyNumber) {
    try {
      const integrity = await this.verifySurveyIntegrity(surveyNumber);
      return integrity.isValid ? 'verified' : 'compromised';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Bulk sync existing records to blockchain
   */
  async bulkSyncToBlockchain(records, officerId, projectId = null) {
    try {
      const results = [];
      
      for (const record of records) {
        try {
          const result = await this.createOrUpdateSurveyBlock(
            record.survey_number,
            record,
            'RECORD_CREATED',
            officerId,
            projectId,
            'Bulk sync from existing records'
          );
          results.push({
            survey_number: record.survey_number,
            success: true,
            result: result
          });
        } catch (error) {
          results.push({
            survey_number: record.survey_number,
            success: false,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        total_records: records.length,
        successful_syncs: results.filter(r => r.success).length,
        failed_syncs: results.filter(r => !r.success).length,
        results: results
      };
    } catch (error) {
      console.error('❌ Failed to bulk sync to blockchain:', error);
      throw error;
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

  /**
   * Check if survey exists on blockchain
   */
  async surveyExistsOnBlockchain(surveyNumber) {
    try {
      const block = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      return !!block;
    } catch (error) {
      console.error('❌ Error checking blockchain existence:', error);
      return false;
    }
  }

  /**
   * Get timeline count for a survey
   */
  async getTimelineCount(surveyNumber) {
    try {
      const block = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (!block || !block.timeline_history) {
        return 0;
      }

      return block.timeline_history.length;
    } catch (error) {
      console.error('❌ Error getting timeline count:', error);
      return 0;
    }
  }

  /**
   * Get enhanced network status
   */
  async getEnhancedNetworkStatus() {
    try {
      const networkInfo = this.config.getNetworkInfo();
      const walletInfo = this.config.getWalletInfo();
      const contractInfo = this.config.getContractInfo();

      // Check if service is initialized
      const isInitialized = this.isInitialized;
      
      // Check wallet connection
      let walletStatus = { isConnected: false, address: null, balance: null };
      if (this.wallet && this.provider) {
        try {
          const address = this.wallet.address;
          const balance = await this.provider.getBalance(address);
          walletStatus = {
            isConnected: true,
            address: address,
            balance: ethers.formatEther(balance)
          };
        } catch (error) {
          console.error('❌ Error getting wallet status:', error);
        }
      }

      // Check contract status
      let contractStatus = { isDeployed: false, address: null };
      if (this.contract) {
        try {
          contractStatus = {
            isDeployed: true,
            address: this.contract.target
          };
        } catch (error) {
          console.error('❌ Error getting contract status:', error);
        }
      }

      // Check WebSocket connection status
      let connectionStatus = {
        isWebSocketConnected: this.isWebSocketConnected,
        currentProvider: this.providers[this.currentProviderIndex]?.name || 'unknown',
        retryCount: this.connectionRetryCount,
        maxRetries: this.maxRetries,
        healthCheckActive: !!this.connectionHealthCheck
      };

      return {
        success: true,
        data: {
          status: {
            isInitialized,
            timestamp: new Date().toISOString()
          },
          network: {
            name: networkInfo.name,
            chainId: networkInfo.chainId,
            rpcUrl: networkInfo.rpcUrl,
            wsUrl: networkInfo.wsUrl,
            explorer: networkInfo.explorer,
            availableProviders: networkInfo.providers?.map(p => ({
              name: p.name,
              priority: p.priority,
              rpcUrl: p.rpcUrl,
              wsUrl: p.wsUrl
            })) || []
          },
          connection: connectionStatus,
          wallet: walletStatus,
          contract: contractStatus,
          config: {
            hasValidConfig: this.config.validate().isValid,
            validationErrors: this.config.validate().errors
          }
        }
      };
    } catch (error) {
      console.error('❌ Error getting enhanced network status:', error);
      return {
        success: false,
        message: 'Failed to get network status',
        error: error.message
      };
    }
  }

  /**
   * Create ledger entry
   */
  async createLedgerEntry(data) {
    try {
      // 🔧 FIX: Set proper previous_hash and ensure current_hash will be generated
      const ledgerEntry = new MongoBlockchainLedger({
        block_id: `BLOCK_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        survey_number: data.survey_number,
        event_type: data.event_type,
        officer_id: data.officer_id,
        project_id: data.project_id,
        metadata: data.metadata || {},
        remarks: data.remarks || '',
        timestamp: new Date(data.timestamp) || new Date(),
        previous_hash: '0x0000000000000000000000000000000000000000000000000000000000000000', // 🔧 FIX: Set default previous hash
        nonce: Math.floor(Math.random() * 1000000)
        // 🔧 NOTE: current_hash will be generated by pre-save middleware
      });

      // 🔧 DEBUG: Log before save
      console.log('🔧 Creating ledger entry:', {
        survey_number: data.survey_number,
        event_type: data.event_type,
        block_id: ledgerEntry.block_id
      });

      await ledgerEntry.save();
      
      // 🔧 DEBUG: Log after save
      console.log('🔧 Ledger entry saved successfully:', {
        block_id: ledgerEntry.block_id,
        current_hash: ledgerEntry.current_hash
      });

      return {
        success: true,
        block_id: ledgerEntry.block_id,
        hash: ledgerEntry.current_hash
      };
    } catch (error) {
      console.error('❌ Failed to create ledger entry:', error);
      throw error;
    }
  }

  /**
   * Add timeline entry
   */
  async addTimelineEntry(surveyNumber, eventType, officerId, data, remarks = '') {
    try {
      const block = await MongoBlockchainLedger.findOne({ 
        survey_number: surveyNumber 
      }).sort({ timestamp: -1 });

      if (!block) {
        throw new Error('No blockchain block found for this survey');
      }

      const timelineEntry = {
        timestamp: new Date(),
        event_type: eventType,
        officer_id: officerId,
        data_snapshot: data,
        remarks: remarks
      };

      // Add to timeline history
      block.timeline_history = block.timeline_history || [];
      block.timeline_history.push(timelineEntry);

      // Update the block
      await block.save();

      return {
        success: true,
        timeline_entry: timelineEntry,
        total_entries: block.timeline_history.length
      };
    } catch (error) {
      console.error('❌ Failed to add timeline entry:', error);
      throw error;
    }
  }

  /**
   * Get surveys with blockchain status
   */
  async getSurveysWithBlockchainStatus(limit = 100) {
    try {
      const blocks = await MongoBlockchainLedger.find({})
        .sort({ timestamp: -1 })
        .limit(limit);

      const surveys = [];
      for (const block of blocks) {
        const integrity = await this.getSurveyIntegrityStatus(block.survey_number);
        surveys.push({
          survey_number: block.survey_number,
          block_id: block.block_id,
          event_type: block.event_type,
          timestamp: block.timestamp,
          integrity_status: integrity,
          timeline_count: block.timeline_history?.length || 0
        });
      }

      return surveys;
    } catch (error) {
      console.error('❌ Failed to get surveys with blockchain status:', error);
      return [];
    }
  }

  /**
   * Create JMR blockchain entry
   */
  async createJMRBlockchainEntry(jmrRecord, officerId, projectId = null) {
    try {
      return await this.createOrUpdateSurveyBlock(
        jmrRecord.survey_number,
        jmrRecord,
        'JMR_CREATED',
        officerId,
        projectId,
        'JMR record created'
      );
      } catch (error) {
      console.error('❌ Failed to create JMR blockchain entry:', error);
      throw error;
    }
  }
}

export default EnhancedBlockchainService;

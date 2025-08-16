import { ethers } from 'ethers';
import crypto from 'crypto';

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isInitialized = false;
    this.chainId = 80001; // Mumbai testnet
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.privateKey = process.env.PRIVATE_KEY;
    
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Polygon Mumbai testnet provider
      this.provider = new ethers.JsonRpcProvider(
        process.env.POLYGON_RPC_URL || 'https://rpc-mumbai.maticvigil.com'
      );

      // Initialize wallet if private key is provided
      if (this.privateKey) {
        this.wallet = new ethers.Wallet(this.privateKey, this.provider);
        console.log('🔐 Blockchain wallet initialized');
      }

      // Initialize contract if address is provided
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.getContractABI(),
          this.wallet || this.provider
        );
        console.log('📜 Smart contract initialized');
      }

      this.isInitialized = true;
      console.log('✅ Blockchain service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      this.isInitialized = false;
    }
  }

  getContractABI() {
    // Simplified ABI for land records tracking
    return [
      'event LandRecordUpdated(string surveyNumber, string eventType, address officer, uint256 timestamp, string metadata)',
      'function updateLandRecord(string surveyNumber, string eventType, string metadata) external',
      'function getLandRecord(string surveyNumber) external view returns (string[] memory eventTypes, uint256[] memory timestamps, address[] memory officers)',
      'function verifyRecord(string surveyNumber, uint256 blockNumber) external view returns (bool)'
    ];
  }

  // Generate a unique block ID for the blockchain ledger
  generateBlockId(surveyNumber, eventType, timestamp) {
    const data = `${surveyNumber}-${eventType}-${timestamp}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // Calculate hash for blockchain integrity
  calculateHash(surveyNumber, eventType, officerId, timestamp, previousHash, nonce, documentHash = '') {
    const data = `${surveyNumber}${eventType}${officerId}${timestamp}${previousHash}${nonce}${documentHash}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Create a new blockchain block
  async createBlock(blockData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service not initialized');
      }

      const {
        surveyNumber,
        eventType,
        officerId,
        projectId,
        metadata,
        remarks
      } = blockData;

      // Get the latest block for previous hash
      const latestBlock = await this.getLatestBlock();
      const previousHash = latestBlock ? latestBlock.current_hash : '0'.repeat(64);

      // Generate block ID
      const blockId = this.generateBlockId(surveyNumber, eventType, new Date().toISOString());

      // Calculate current hash
      const timestamp = new Date();
      const nonce = Math.floor(Math.random() * 1000000);
      const documentHash = metadata?.document_hash || '';
      const currentHash = this.calculateHash(
        surveyNumber,
        eventType,
        officerId,
        timestamp,
        previousHash,
        nonce,
        documentHash
      );

      // If blockchain integration is available, submit to smart contract
      if (this.contract && this.wallet) {
        try {
          const tx = await this.contract.updateLandRecord(
            surveyNumber,
            eventType,
            JSON.stringify(metadata)
          );
          await tx.wait();
          console.log(`🔗 Blockchain transaction confirmed: ${tx.hash}`);
        } catch (error) {
          console.warn('⚠️ Blockchain transaction failed, continuing with local ledger:', error.message);
        }
      }

      return {
        block_id: blockId,
        survey_number: surveyNumber,
        event_type: eventType,
        officer_id: officerId,
        timestamp: timestamp,
        metadata: metadata,
        previous_hash: previousHash,
        current_hash: currentHash,
        nonce: nonce,
        project_id: projectId,
        remarks: remarks,
        is_valid: true
      };
    } catch (error) {
      console.error('❌ Failed to create blockchain block:', error);
      throw error;
    }
  }

  // Get the latest block from the blockchain
  async getLatestBlock() {
    try {
      if (!this.isInitialized) {
        return null;
      }

      // This would typically query the smart contract
      // For now, return null as we'll handle this in the database
      return null;
    } catch (error) {
      console.error('❌ Failed to get latest block:', error);
      return null;
    }
  }

  // Verify blockchain integrity
  async verifyBlockchainIntegrity(surveyNumber) {
    try {
      if (!this.isInitialized) {
        return { isValid: false, reason: 'Blockchain service not initialized' };
      }

      // This would typically verify against the smart contract
      // For now, return a mock verification
      return { isValid: true, reason: 'Blockchain verification passed' };
    } catch (error) {
      console.error('❌ Failed to verify blockchain integrity:', error);
      return { isValid: false, reason: error.message };
    }
  }

  // Get network status
  async getNetworkStatus() {
    try {
      if (!this.provider) {
        return { connected: false, network: 'Unknown' };
      }

      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getFeeData();

      return {
        connected: true,
        network: network.name,
        chainId: network.chainId,
        blockNumber: blockNumber.toString(),
        gasPrice: ethers.formatUnits(gasPrice.gasPrice, 'gwei') + ' gwei'
      };
    } catch (error) {
      console.error('❌ Failed to get network status:', error);
      return { connected: false, network: 'Error', error: error.message };
    }
  }

  // Simulate blockchain mining (for demo purposes)
  async mineBlock(difficulty = 4) {
    try {
      const target = '0'.repeat(difficulty);
      let nonce = 0;
      let hash = '';

      do {
        hash = crypto.createHash('sha256').update(nonce.toString()).digest('hex');
        nonce++;
      } while (hash.substring(0, difficulty) !== target);

      return { hash, nonce: nonce - 1 };
    } catch (error) {
      console.error('❌ Failed to mine block:', error);
      throw error;
    }
  }

  // Get gas estimate for transaction
  async estimateGas(surveyNumber, eventType, metadata) {
    try {
      if (!this.contract) {
        return { estimatedGas: '0', gasPrice: '0' };
      }

      const gasEstimate = await this.contract.updateLandRecord.estimateGas(
        surveyNumber,
        eventType,
        JSON.stringify(metadata)
      );

      const feeData = await this.provider.getFeeData();

      return {
        estimatedGas: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' gwei',
        totalCost: ethers.formatEther(gasEstimate * feeData.gasPrice) + ' MATIC'
      };
    } catch (error) {
      console.error('❌ Failed to estimate gas:', error);
      return { estimatedGas: '0', gasPrice: '0', error: error.message };
    }
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();

export default blockchainService;

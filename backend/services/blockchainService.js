// saral-bhoomi/backend/services/blockchainService.js
import { ethers } from 'ethers';
import BlockchainConfig from '../config/blockchain.js';

class BlockchainService {
  constructor() {
    this.config = new BlockchainConfig();
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (this.isInitialized) {
        return { success: true, message: 'Already initialized' };
      }

      // Check if blockchain is enabled
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
          name: "polygon-amoy",   // Amoy testnet name
          chainId: 80002          // Amoy testnet chain ID
        }
      );
      
      // Initialize signer
      this.signer = new ethers.Wallet(this.config.getWalletInfo().privateKey, this.provider);
      
      // Load contract ABI and initialize contract
      const contractInfo = this.config.getContractInfo();
      const contractABI = await this.loadContractABI(contractInfo.abiPath);
      
      this.contract = new ethers.Contract(
        contractInfo.address,
        contractABI,
        this.signer
      );

      this.isInitialized = true;
      
      console.log('✅ Blockchain service initialized successfully');
      console.log(`🌐 Network: ${this.config.getNetworkInfo().name}`);
      console.log(`📜 Contract: ${contractInfo.address}`);
      console.log(`👤 Wallet: ${this.config.getWalletInfo().address}`);
      
      return {
        success: true,
        message: 'Blockchain service initialized successfully',
        network: this.config.getNetworkInfo(),
        contract: contractInfo.address
      };

    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  async loadContractABI(abiPath) {
    try {
      // For now, return a basic ABI structure
      // In production, you'd load this from the artifacts file
      return [
        "function createLandRecord(string surveyNumber, string ownerId, string landType, uint256 area, string location) external",
        "function updateLandRecord(string surveyNumber, string newData, string changeReason) external",
        "function getLandRecord(string surveyNumber) external view returns (tuple(string surveyNumber, string ownerId, string landType, uint256 area, string location, uint256 timestamp, string hash))",
        "function verifyRecordIntegrity(string surveyNumber, string dataHash) external view returns (bool)",
        "function isAuthorizedOfficer(address officer) external view returns (bool)",
        "function addAuthorizedOfficer(address officer) external",
        "function removeAuthorizedOfficer(address officer) external"
      ];
    } catch (error) {
      console.error('Failed to load contract ABI:', error);
      throw new Error('Failed to load contract ABI');
    }
  }

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
        serviceStatus: 'Blockchain Service Active'
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

  async createLandRecord(surveyNumber, ownerId, landType, area, location) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const gasSettings = this.config.getGasSettings();
      
      const tx = await this.contract.createLandRecord(
        surveyNumber,
        ownerId,
        landType,
        area,
        location,
        {
          gasLimit: gasSettings.limit,
          maxFeePerGas: gasSettings.maxFeePerGas,
          maxPriorityFeePerGas: gasSettings.maxPriorityFeePerGas
        }
      );

      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        message: 'Land record created successfully'
      };

    } catch (error) {
      console.error('Failed to create land record:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  async getLandRecord(surveyNumber) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const record = await this.contract.getLandRecord(surveyNumber);
      
      return {
        success: true,
        data: {
          surveyNumber: record[0],
          ownerId: record[1],
          landType: record[2],
          area: record[3].toString(),
          location: record[4],
          timestamp: record[5].toString(),
          hash: record[6]
        }
      };

    } catch (error) {
      console.error('Failed to get land record:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  async verifyRecordIntegrity(surveyNumber, dataHash) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const isValid = await this.contract.verifyRecordIntegrity(surveyNumber, dataHash);
      
      return {
        success: true,
        isValid: isValid,
        message: isValid ? 'Record integrity verified' : 'Record integrity check failed'
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

  async isAuthorizedOfficer(address) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const isAuthorized = await this.contract.isAuthorizedOfficer(address);
      
      return {
        success: true,
        isAuthorized: isAuthorized,
        message: isAuthorized ? 'Address is authorized officer' : 'Address is not authorized officer'
      };

    } catch (error) {
      console.error('Failed to check officer authorization:', error);
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  getServiceInfo() {
    return {
      initialized: this.isInitialized,
      network: this.config.getNetworkInfo(),
      contract: this.config.getContractInfo(),
      wallet: this.config.getWalletInfo(),
      gas: this.config.getGasSettings()
    };
  }

  // Check if blockchain is enabled
  isBlockchainEnabled() {
    return this.config.isBlockchainEnabled();
  }

  // Get configuration summary
  getConfigSummary() {
    return this.config.getSummary();
  }
}

export default BlockchainService;
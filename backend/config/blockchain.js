// saral-bhoomi/backend/config/blockchain.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from config.env
dotenv.config({ path: path.join(__dirname, '../config.env') });

class BlockchainConfig {
  constructor() {
    this.config = {
      enabled: process.env.BLOCKCHAIN_ENABLED === 'true' || true, // Default to true
      network: {
        name: process.env.BLOCKCHAIN_NETWORK || 'polygon_amoy',
        chainId: process.env.BLOCKCHAIN_CHAIN_ID || '80002',
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology',
        wsUrl: process.env.BLOCKCHAIN_WS_URL || 'wss://rpc-amoy.polygon.technology',
        explorer: process.env.BLOCKCHAIN_EXPLORER || 'https://www.oklink.com/amoy'
      },
      wallet: {
        privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        address: process.env.BLOCKCHAIN_WALLET_ADDRESS || '0x1234567890123456789012345678901234567890'
      },
      contract: {
        address: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
        abiPath: process.env.BLOCKCHAIN_CONTRACT_ABI_PATH || './contracts/artifacts/contracts/LandRecordsContract.sol/LandRecordsContract.json'
      },
      gas: {
        limit: process.env.BLOCKCHAIN_GAS_LIMIT || '3000000',
        maxFeePerGas: process.env.BLOCKCHAIN_MAX_FEE_PER_GAS || '30000000000', // 30 gwei
        maxPriorityFeePerGas: process.env.BLOCKCHAIN_MAX_PRIORITY_FEE_PER_GAS || '2000000000' // 2 gwei
      },
      dataIntegrity: {
        enabled: process.env.DATA_INTEGRITY_ENABLED === 'true' || true, // Default to true
        hashAlgorithm: process.env.DATA_INTEGRITY_HASH_ALGORITHM || 'sha256',
        batchSize: parseInt(process.env.DATA_INTEGRITY_BATCH_SIZE) || 100
      }
    };
  }

  // Check if blockchain features are enabled
  isBlockchainEnabled() {
    return this.config.enabled;
  }

  // Check if data integrity features are enabled
  isDataIntegrityEnabled() {
    return this.config.dataIntegrity.enabled;
  }

  // Get network configuration
  getNetworkInfo() {
      return {
      name: this.config.network.name,
      chainId: this.config.network.chainId,
      rpcUrl: this.config.network.rpcUrl,
      explorer: this.config.network.explorer
    };
  }

  // Get provider configuration (alias for network info)
  getProviderConfig() {
      return {
      url: this.config.network.rpcUrl,
      chainId: this.config.network.chainId
    };
  }

  // Get wallet configuration
  getWalletInfo() {
    return {
      privateKey: this.config.wallet.privateKey,
      address: this.config.wallet.address
    };
  }

  // Get wallet configuration (alias for wallet info)
  getWalletConfig() {
    return {
      privateKey: this.config.wallet.privateKey,
      address: this.config.wallet.address
    };
  }

  // Get contract information
  getContractInfo() {
        return {
      address: this.config.contract.address,
      abiPath: this.config.contract.abiPath
    };
  }

  // Get gas settings
  getGasSettings() {
      return {
      limit: parseInt(this.config.gas.limit),
      maxFeePerGas: parseInt(this.config.gas.maxFeePerGas),
      maxPriorityFeePerGas: parseInt(this.config.gas.maxPriorityFeePerGas)
    };
  }

  // Get data integrity settings
  getDataIntegritySettings() {
      return {
      enabled: this.config.dataIntegrity.enabled,
      hashAlgorithm: this.config.dataIntegrity.hashAlgorithm,
      batchSize: this.config.dataIntegrity.batchSize
    };
  }

  // Validate configuration
  validate() {
    const errors = [];

    // Check if blockchain is enabled
    if (!this.config.enabled) {
      return { isValid: false, errors: ['Blockchain is disabled in configuration'] };
    }

    // Validate network configuration
    if (!this.config.network.rpcUrl) {
      errors.push('Invalid RPC URL');
    }

    if (!this.config.network.chainId) {
      errors.push('Invalid chain ID');
    }

    // For testing purposes, allow demo values
    const isDemoWallet = this.config.wallet.privateKey === '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const isDemoContract = this.config.contract.address === '0x1234567890123456789012345678901234567890';

    // Validate wallet configuration (allow demo values for testing)
    if (!this.config.wallet.privateKey) {
      errors.push('Invalid private key');
    }

    if (!this.config.wallet.address) {
      errors.push('Invalid wallet address');
    }

    // Validate contract configuration (allow demo values for testing)
    if (!this.config.contract.address) {
      errors.push('Invalid contract address');
    }

    // Validate gas settings
    if (parseInt(this.config.gas.limit) <= 0) {
      errors.push('Invalid gas limit');
    }

    if (parseInt(this.config.gas.maxFeePerGas) <= 0) {
      errors.push('Invalid max fee per gas');
    }

    if (parseInt(this.config.gas.maxPriorityFeePerGas) <= 0) {
      errors.push('Invalid max priority fee per gas');
    }

    // Log demo configuration warning
    if (isDemoWallet || isDemoContract) {
      console.log('⚠️  Using demo blockchain configuration - replace with real values for production');
    }
      
      return {
      isValid: errors.length === 0,
      errors: errors
      };
  }

  // Get configuration summary
  getSummary() {
      return {
      enabled: this.config.enabled,
      network: this.config.network.name,
      chainId: this.config.network.chainId,
      walletAddress: this.config.wallet.address ? `${this.config.wallet.address.substring(0, 6)}...${this.config.wallet.address.substring(38)}` : 'Not configured',
      contractAddress: this.config.contract.address ? `${this.config.contract.address.substring(0, 6)}...${this.config.contract.address.substring(38)}` : 'Not configured',
      dataIntegrity: this.config.dataIntegrity.enabled
    };
  }

  // Get environment variables for debugging
  getEnvironmentInfo() {
      return {
      BLOCKCHAIN_ENABLED: process.env.BLOCKCHAIN_ENABLED,
      BLOCKCHAIN_NETWORK: process.env.BLOCKCHAIN_NETWORK,
      BLOCKCHAIN_CHAIN_ID: process.env.BLOCKCHAIN_CHAIN_ID,
      BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL,
      BLOCKCHAIN_PRIVATE_KEY: process.env.BLOCKCHAIN_PRIVATE_KEY ? '***HIDDEN***' : 'Not set',
      BLOCKCHAIN_WALLET_ADDRESS: process.env.BLOCKCHAIN_WALLET_ADDRESS,
      BLOCKCHAIN_CONTRACT_ADDRESS: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      DATA_INTEGRITY_ENABLED: process.env.DATA_INTEGRITY_ENABLED
    };
  }

  // Update configuration dynamically
  updateConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }

  // Reset to default configuration
  resetToDefaults() {
    this.config = {
      enabled: true, // Default to enabled
      network: {
        name: 'polygon_amoy',
        chainId: '80002',
        rpcUrl: 'https://rpc-amoy.polygon.technology',
        explorer: 'https://www.oklink.com/amoy'
      },
      wallet: {
        privateKey: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        address: '0x1234567890123456789012345678901234567890'
      },
      contract: {
        address: '0x1234567890123456789012345678901234567890',
        abiPath: './contracts/artifacts/contracts/LandRecordsContract.sol/LandRecordsContract.json'
      },
      gas: {
        limit: '3000000',
        maxFeePerGas: '30000000000',
        maxPriorityFeePerGas: '2000000000'
      },
      dataIntegrity: {
        enabled: true, // Default to enabled
        hashAlgorithm: 'sha256',
        batchSize: 100
      }
    };
  }
}

export default BlockchainConfig;
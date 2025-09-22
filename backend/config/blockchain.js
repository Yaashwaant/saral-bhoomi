/**
 * Blockchain Configuration for SARAL Bhoomi
 * 
 * This configuration manages blockchain connectivity for data integrity verification.
 * For production deployment, blockchain features can be disabled if not needed.
 */

class BlockchainConfig {
  constructor() {
    this.config = {
      // Enable/disable blockchain features
      enabled: process.env.BLOCKCHAIN_ENABLED === 'true' || false,
      
      // Network configuration (Polygon Amoy Testnet)
      network: {
        name: 'polygon-amoy',
        chainId: 80002,
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'https://rpc-amoy.polygon.technology',
        explorerUrl: 'https://www.oklink.com/amoy'
      },
      
      // Wallet configuration
      wallet: {
        privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || null
      },
      
      // Smart contract configuration
      contract: {
        address: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || null,
        deployerAddress: process.env.BLOCKCHAIN_DEPLOYER_ADDRESS || null
      }
    };
  }

  /**
   * Check if blockchain features are enabled
   */
  isBlockchainEnabled() {
    return this.config.enabled;
  }

  /**
   * Validate blockchain configuration
   */
  validate() {
    if (!this.config.enabled) {
      return true; // Valid if disabled
    }

    const requiredFields = [
      this.config.wallet.privateKey,
      this.config.contract.address,
      this.config.network.rpcUrl
    ];

    return requiredFields.every(field => field && field.length > 0);
  }

  /**
   * Get network information
   */
  getNetworkInfo() {
    return this.config.network;
  }

  /**
   * Get wallet information
   */
  getWalletInfo() {
    return this.config.wallet;
  }

  /**
   * Get contract information
   */
  getContractInfo() {
    return this.config.contract;
  }

  /**
   * Get full configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Log configuration status (without sensitive data)
   */
  logStatus() {
    const status = {
      enabled: this.config.enabled,
      network: this.config.network.name,
      chainId: this.config.network.chainId,
      hasPrivateKey: !!this.config.wallet.privateKey,
      hasContractAddress: !!this.config.contract.address,
      isValid: this.validate()
    };

    console.log('🔗 Blockchain Configuration:', status);
    return status;
  }
}

export default BlockchainConfig;
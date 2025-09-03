import crypto from 'crypto';
import { ethers } from 'ethers';
import BlockchainConfig from '../config/blockchain.js';

// Create blockchain config instance
const blockchainConfig = new BlockchainConfig();

class DataIntegrityService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isInitialized = false;
  }

  /**
   * Initialize blockchain connection only if enabled
   */
  async initialize() {
    try {
      if (!blockchainConfig.isBlockchainEnabled()) {
        console.log('ℹ️ Blockchain features disabled - data integrity will be simulated');
        return false;
      }

      if (!blockchainConfig.validate()) {
        console.log('⚠️ Blockchain configuration incomplete - data integrity will be simulated');
        return false;
      }

      // Initialize ethers provider and wallet with explicit network configuration
      this.provider = new ethers.JsonRpcProvider(
        blockchainConfig.getNetworkInfo().rpcUrl,
        {
          name: "polygon-amoy",   // Amoy testnet name
          chainId: 80002          // Amoy testnet chain ID
        }
      );
      this.wallet = new ethers.Wallet(blockchainConfig.getWalletInfo().privateKey, this.provider);
      
      // Initialize contract with updated ABI for sequential workflow
      const contractABI = [
        "function addLandRecords(string surveyNumber, string dataHash, string projectName, string landownerName, string metadata) external",
        "function updatePaymentGenerated(string surveyNumber, string paymentHash, uint256 compensationAmount, string metadata) external",
        "function completeOwnershipTransfer(string surveyNumber, string ownershipHash, string metadata) external",
        "function getSurveyWorkflow(string surveyNumber) external view returns (string, string, string, string, uint8, uint256, uint256, uint256, string, string, uint256, bool)",
        "function getWorkflowStage(string surveyNumber) external view returns (uint8)",
        "function isWorkflowCompleted(string surveyNumber) external view returns (bool)",
        "function getProjectName(string surveyNumber) external view returns (string)",
        "function getCompensationAmount(string surveyNumber) external view returns (uint256)"
      ];
      
      this.contract = new ethers.Contract(blockchainConfig.getContractInfo().address, contractABI, this.wallet);
      this.isInitialized = true;
      
      console.log('✅ Data integrity service initialized with blockchain');
      return true;
    } catch (error) {
      console.warn('⚠️ Failed to initialize blockchain for data integrity:', error.message);
      return false;
    }
  }

  /**
   * Generate hash from land record data
   */
  generateDataHash(surveyData) {
    try {
      // Combine all relevant data into a single string
      const dataString = JSON.stringify({
        survey_number: surveyData.survey_number,
        jmr_data: surveyData.jmr || {},
        award_data: surveyData.award || {},
        land_record_data: surveyData.landRecord || {}
        // 🔧 REMOVED: timestamp: new Date().toISOString() - causes hash changes
      });

      // Generate SHA-256 hash
      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      console.error('❌ Error generating data hash:', error);
      throw new Error('Failed to generate data hash');
    }
  }

  /**
   * Generate hash from payment data
   */
  generatePaymentHash(paymentData) {
    try {
      const dataString = JSON.stringify({
        survey_number: paymentData.survey_number,
        payment_id: paymentData.payment_id,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        utr_number: paymentData.utr_number
        // 🔧 REMOVED: timestamp: new Date().toISOString() - causes hash changes
      });

      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      console.error('❌ Error generating payment hash:', error);
      throw new Error('Failed to generate payment hash');
    }
  }

  /**
   * Generate hash from ownership transfer data
   */
  generateOwnershipHash(ownershipData) {
    try {
      const dataString = JSON.stringify({
        survey_number: ownershipData.survey_number,
        project_name: ownershipData.project_name,
        previous_owner: ownershipData.previous_owner,
        new_owner: ownershipData.new_owner,
        transfer_date: ownershipData.transfer_date
        // 🔧 REMOVED: timestamp: new Date().toISOString() - causes hash changes
      });

      return crypto.createHash('sha256').update(dataString).digest('hex');
    } catch (error) {
      console.error('❌ Error generating ownership hash:', error);
      throw new Error('Failed to generate payment hash');
    }
  }

  /**
   * Step 1: Add land records and create initial blockchain block
   */
  async addLandRecords(surveyNumber, surveyData, projectName, landownerName, metadata = {}) {
    try {
      if (!this.isInitialized) {
        console.log('ℹ️ Blockchain not available - simulating land records addition');
        return {
          success: true,
          survey_number: surveyNumber,
          data_hash: 'simulated_hash',
          blockchain_tx: 'simulated',
          message: 'Land records added (simulated - blockchain disabled)'
        };
      }

      // Generate hash from land record data
      const dataHash = this.generateDataHash(surveyData);
      
      // Prepare transaction
      const tx = await this.contract.addLandRecords(
        surveyNumber,
        dataHash,
        projectName,
        landownerName,
        JSON.stringify(metadata),
        {
          gasLimit: 500000,
          maxFeePerGas: ethers.parseUnits('50', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        survey_number: surveyNumber,
        data_hash: dataHash,
        blockchain_tx: receipt.hash,
        block_number: receipt.blockNumber,
        message: 'Land records added to blockchain successfully'
      };
    } catch (error) {
      console.error('❌ Error adding land records to blockchain:', error);
      return {
        success: false,
        survey_number: surveyNumber,
        error: error.message,
        message: 'Failed to add land records to blockchain'
      };
    }
  }

  /**
   * Step 2: Update blockchain with payment slip generation
   */
  async updatePaymentGenerated(surveyNumber, paymentData, metadata = {}) {
    try {
      if (!this.isInitialized) {
        console.log('ℹ️ Blockchain not available - simulating payment update');
        return {
          success: true,
          survey_number: surveyNumber,
          payment_hash: 'simulated_hash',
          blockchain_tx: 'simulated',
          message: 'Payment updated (simulated - blockchain disabled)'
        };
      }

      // Generate hash from payment data
      const paymentHash = this.generatePaymentHash(paymentData);
      
      // Prepare transaction
      const tx = await this.contract.updatePaymentGenerated(
        surveyNumber,
        paymentHash,
        ethers.parseUnits(paymentData.amount.toString(), 'wei'),
        JSON.stringify(metadata),
        {
          gasLimit: 400000,
          maxFeePerGas: ethers.parseUnits('50', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        survey_number: surveyNumber,
        payment_hash: paymentHash,
        blockchain_tx: receipt.hash,
        block_number: receipt.blockNumber,
        message: 'Payment information updated on blockchain successfully'
      };
    } catch (error) {
      console.error('❌ Error updating payment on blockchain:', error);
      return {
        success: false,
        survey_number: surveyNumber,
        error: error.message,
        message: 'Failed to update payment on blockchain'
      };
    }
  }

  /**
   * Step 3: Complete workflow with ownership transfer
   */
  async completeOwnershipTransfer(surveyNumber, ownershipData, metadata = {}) {
    try {
      if (!this.isInitialized) {
        console.log('ℹ️ Blockchain not available - simulating ownership transfer');
        return {
          success: true,
          survey_number: surveyNumber,
          ownership_hash: 'simulated_hash',
          blockchain_tx: 'simulated',
          message: 'Ownership transferred (simulated - blockchain disabled)'
        };
      }

      // Generate hash from ownership transfer data
      const ownershipHash = this.generateOwnershipHash(ownershipData);
      
      // Prepare transaction
      const tx = await this.contract.completeOwnershipTransfer(
        surveyNumber,
        ownershipHash,
        JSON.stringify(metadata),
        {
          gasLimit: 400000,
          maxFeePerGas: ethers.parseUnits('50', 'gwei'),
          maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
        }
      );

      // Wait for confirmation
      const receipt = await tx.wait();
      
      return {
        success: true,
        survey_number: surveyNumber,
        ownership_hash: ownershipHash,
        blockchain_tx: receipt.hash,
        block_number: receipt.blockNumber,
        message: 'Ownership transfer completed on blockchain successfully'
      };
    } catch (error) {
      console.error('❌ Error completing ownership transfer on blockchain:', error);
      return {
        success: false,
        survey_number: surveyNumber,
        error: error.message,
        message: 'Failed to complete ownership transfer on blockchain'
      };
    }
  }

  /**
   * Get complete workflow status for a survey number
   */
  async getSurveyWorkflow(surveyNumber) {
    try {
      if (!this.isInitialized) {
        console.log('ℹ️ Blockchain not available - simulating workflow status');
        return {
          survey_number: surveyNumber,
          current_stage: 'LandRecordsAdded',
          is_completed: false,
          message: 'Workflow status simulated (blockchain disabled)'
        };
      }

      // Get workflow data from blockchain
      const workflowData = await this.contract.getSurveyWorkflow(surveyNumber);
      
      // Parse the returned data
      const [
        surveyNum,
        landRecordsHash,
        paymentHash,
        ownershipHash,
        currentStage,
        landRecordsTimestamp,
        paymentTimestamp,
        ownershipTimestamp,
        projectName,
        landownerName,
        compensationAmount,
        isCompleted
      ] = workflowData;

      // Map stage numbers to readable names
      const stageNames = ['NotStarted', 'LandRecordsAdded', 'PaymentGenerated', 'OwnershipTransferred'];
      
      return {
        survey_number: surveyNum,
        current_stage: stageNames[currentStage],
        is_completed: isCompleted,
        project_name: projectName,
        landowner_name: landownerName,
        compensation_amount: ethers.formatEther(compensationAmount),
        timestamps: {
          land_records: new Date(Number(landRecordsTimestamp) * 1000).toISOString(),
          payment: paymentTimestamp > 0 ? new Date(Number(paymentTimestamp) * 1000).toISOString() : null,
          ownership: ownershipTimestamp > 0 ? new Date(Number(ownershipTimestamp) * 1000).toISOString() : null
        },
        hashes: {
          land_records: landRecordsHash,
          payment: paymentHash,
          ownership: ownershipHash
        },
        message: 'Workflow status retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Error getting survey workflow:', error);
      return {
        survey_number: surveyNumber,
        error: error.message,
        message: 'Failed to retrieve workflow status'
      };
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      is_initialized: this.isInitialized,
      blockchain_enabled: blockchainConfig.isBlockchainEnabled(),
      provider_connected: !!this.provider,
      wallet_connected: !!this.wallet,
      contract_connected: !!this.contract
    };
  }
}

export default new DataIntegrityService();

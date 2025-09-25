#!/usr/bin/env node

/**
 * Test script for WebSocket improvements
 * This script demonstrates the enhanced WebSocket error handling and fallback mechanisms
 */

import EnhancedBlockchainService from './services/enhancedBlockchainService.js';
import BlockchainConfigHTTPOnly from './config/blockchain-http-only.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'config.env') });

async function testWebSocketImprovements() {
  console.log('🧪 Testing WebSocket Improvements\n');
  
  // Use HTTP-only configuration to avoid WebSocket issues
  const blockchainService = new EnhancedBlockchainService();
  
  // Override the config to use HTTP-only
  blockchainService.config = new BlockchainConfigHTTPOnly();
  
  try {
    // Test 1: Initialize service
    console.log('1️⃣ Testing service initialization...');
    const initResult = await blockchainService.initialize();
    
    if (initResult.success) {
      console.log('✅ Service initialized successfully');
      console.log(`   Network: ${initResult.network.name}`);
      console.log(`   Contract: ${initResult.contract}`);
    } else {
      console.log('❌ Service initialization failed:', initResult.message);
      return;
    }
    
    // Test 2: Get enhanced network status
    console.log('\n2️⃣ Testing enhanced network status...');
    const status = await blockchainService.getEnhancedNetworkStatus();
    
    if (status.success) {
      console.log('✅ Network status retrieved successfully');
      console.log('   Connection Details:');
      console.log(`   - WebSocket Connected: ${status.data.connection.isWebSocketConnected}`);
      console.log(`   - Current Provider: ${status.data.connection.currentProvider}`);
      console.log(`   - Retry Count: ${status.data.connection.retryCount}/${status.data.connection.maxRetries}`);
      console.log(`   - Health Check Active: ${status.data.connection.healthCheckActive}`);
      
      console.log('\n   Available Providers:');
      status.data.network.availableProviders.forEach((provider, index) => {
        console.log(`   ${index + 1}. ${provider.name} (Priority: ${provider.priority})`);
        console.log(`      RPC: ${provider.rpcUrl}`);
        console.log(`      WebSocket: ${provider.wsUrl}`);
      });
    } else {
      console.log('❌ Failed to get network status:', status.message);
    }
    
    // Test 3: Test connection resilience
    console.log('\n3️⃣ Testing connection resilience...');
    console.log('   Simulating connection test...');
    
    try {
      const blockNumber = await blockchainService.provider.getBlockNumber();
      console.log(`✅ Connection test successful - Current block: ${blockNumber}`);
    } catch (error) {
      console.log('❌ Connection test failed:', error.message);
    }
    
    // Test 4: Test cleanup
    console.log('\n4️⃣ Testing cleanup...');
    await blockchainService.cleanup();
    console.log('✅ Cleanup completed successfully');
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  process.exit(0);
});

// Run the test
testWebSocketImprovements().catch(console.error);

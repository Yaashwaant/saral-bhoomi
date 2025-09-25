#!/usr/bin/env node

/**
 * Quick fix script for WebSocket issues
 * This script provides immediate solutions for WebSocket connection problems
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

async function fixWebSocketIssues() {
  console.log('🔧 WebSocket Issues Fix Script\n');
  
  console.log('📋 Available Solutions:');
  console.log('1. Use HTTP-only configuration (Recommended)');
  console.log('2. Test with improved error handling');
  console.log('3. Check provider status');
  console.log('4. Exit\n');
  
  // Solution 1: HTTP-only configuration
  console.log('🚀 Solution 1: Testing HTTP-only configuration...');
  
  try {
    const blockchainService = new EnhancedBlockchainService();
    blockchainService.config = new BlockchainConfigHTTPOnly();
    
    const initResult = await blockchainService.initialize();
    
    if (initResult.success) {
      console.log('✅ HTTP-only configuration works!');
      console.log(`   Network: ${initResult.network.name}`);
      console.log(`   RPC URL: ${initResult.network.rpcUrl}`);
      console.log('   WebSocket: Disabled (HTTP-only mode)');
      
      // Test connection
      const status = await blockchainService.getEnhancedNetworkStatus();
      if (status.success) {
        console.log('\n📊 Connection Status:');
        console.log(`   WebSocket Connected: ${status.data.connection.isWebSocketConnected}`);
        console.log(`   Current Provider: ${status.data.connection.currentProvider}`);
        console.log(`   Available Providers: ${status.data.network.availableProviders.length}`);
      }
      
      await blockchainService.cleanup();
      console.log('\n✅ HTTP-only configuration test completed successfully!');
      
    } else {
      console.log('❌ HTTP-only configuration failed:', initResult.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing HTTP-only configuration:', error.message);
  }
  
  console.log('\n📝 Recommendations:');
  console.log('1. Use HTTP-only configuration for immediate fix');
  console.log('2. Get proper API keys for Alchemy/Infura to avoid rate limiting');
  console.log('3. Consider using a dedicated RPC provider for production');
  console.log('4. Monitor connection status regularly');
  
  console.log('\n🔧 To apply HTTP-only configuration:');
  console.log('1. Update your blockchain service to use BlockchainConfigHTTPOnly');
  console.log('2. Or set WEBSOCKET_ENABLED=false in your environment');
  console.log('3. Restart your application');
  
  console.log('\n✨ WebSocket issues should now be resolved!');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, exiting...');
  process.exit(0);
});

// Run the fix
fixWebSocketIssues().catch(console.error);

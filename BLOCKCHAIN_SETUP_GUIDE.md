# Blockchain Setup Guide for SARAL Bhoomi

This guide will help you set up the complete blockchain system for land records management on Polygon Mumbai testnet.

## 🚀 Quick Start

1. **Clone and Setup**: Follow the main project setup
2. **Configure Environment**: Set up blockchain environment variables
3. **Deploy Smart Contract**: Deploy to Polygon Mumbai testnet
4. **Configure Backend**: Update backend with contract details
5. **Test Integration**: Verify blockchain functionality

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask wallet with Polygon Mumbai testnet configured
- Test MATIC tokens (get from [Polygon Faucet](https://faucet.polygon.technology/))
- Basic understanding of blockchain concepts

## 🔧 Environment Configuration

### 1. Create Environment File

Copy `backend/env.blockchain.example` to `backend/.env` and configure:

```bash
# Blockchain Configuration
ENABLE_BLOCKCHAIN=true
ENABLE_SMART_CONTRACTS=true
ENABLE_GAS_ESTIMATION=true
ENABLE_TRANSACTION_TRACKING=true
ENABLE_BLOCK_EXPLORER=false

# Network Configuration (Polygon Mumbai Testnet)
NETWORK_NAME=polygon_mumbai
CHAIN_ID=80001
RPC_URL=https://rpc-mumbai.maticvigil.com
BLOCK_EXPLORER_URL=https://mumbai.polygonscan.com

# Wallet Configuration
PRIVATE_KEY=your_private_key_here
PUBLIC_ADDRESS=your_wallet_address_here

# Smart Contract Configuration
CONTRACT_ADDRESS=your_deployed_contract_address_here
CONTRACT_NAME=LandRecordsContract

# Gas Configuration
GAS_PRICE=auto
GAS_LIMIT=3000000
MAX_PRIORITY_FEE=2
MAX_FEE=50

# Security Configuration
REQUIRE_SIGNATURE_VERIFICATION=false
ENABLE_MULTISIG=false
MAX_TRANSACTION_VALUE=1000000000000000000

# Monitoring Configuration
ENABLE_BLOCKCHAIN_MONITORING=true
BLOCKCHAIN_LOG_LEVEL=info
TRANSACTION_TIMEOUT=300000
```

### 2. Get Test MATIC

1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Connect your MetaMask wallet
3. Select Mumbai testnet
4. Request test MATIC (recommended: 2-5 MATIC)

## 🏗️ Smart Contract Deployment

### 1. Navigate to Contracts Directory

```bash
cd saral-bhoomi/contracts
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Hardhat

Update `hardhat.config.js` for Mumbai testnet:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    mumbai: {
      url: process.env.POLYGON_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
      gasPrice: "auto",
      gas: 3000000
    }
  },
  etherscan: {
    apiKey: process.env.POLYGONSCAN_API_KEY
  }
};
```

### 4. Deploy Contract

```bash
npx hardhat run scripts/deploy.js --network mumbai
```

### 5. Verify Contract

1. Copy the deployed contract address
2. Update your `.env` file with `CONTRACT_ADDRESS`
3. Verify on [Mumbai Polygonscan](https://mumbai.polygonscan.com/)

```bash
npx hardhat verify --network mumbai DEPLOYED_CONTRACT_ADDRESS
```

## 🔗 Backend Configuration

### 1. Update Environment Variables

Ensure your backend `.env` has the correct contract address and wallet details.

### 2. Test Blockchain Service

```bash
cd saral-bhoomi/backend
npm run dev
```

Test the health endpoint:
```bash
curl http://localhost:5000/api/blockchain/health
```

### 3. Test Authentication

Ensure JWT authentication is working for protected endpoints.

## 🎯 Frontend Integration

### 1. Component Structure

The blockchain dashboard is located at:
```
src/components/saral/officer/BlockchainDashboard.tsx
```

### 2. Features Available

- **Overview Tab**: Blockchain status, network info, gas prices
- **Search & Verify**: Search surveys, verify integrity
- **Timeline**: View survey timeline events
- **Actions**: Create blocks, add events, verify integrity

### 3. Testing the Interface

1. Start the frontend: `npm run dev`
2. Navigate to Officer Dashboard
3. Click on "Blockchain" tab
4. Test search and verification features

## 🔍 Testing Blockchain Functions

### 1. Create Survey Block

```javascript
// Example API call
const response = await fetch('/api/blockchain/create-survey', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    surveyNumber: 'SURVEY_001',
    ownerId: 'OWNER_001',
    landType: 'Agricultural',
    jmrData: { area: '2.5 hectares' },
    awardData: { compensation: '₹500,000' },
    landRecordData: { survey: 'Complete' }
  })
});
```

### 2. Add Timeline Event

```javascript
const response = await fetch('/api/blockchain/add-event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    surveyNumber: 'SURVEY_001',
    eventType: 'JMR_Measurement_Uploaded',
    ownerId: 'OWNER_001',
    landType: 'Agricultural',
    details: 'JMR measurements completed'
  })
});
```

### 3. Verify Integrity

```javascript
const response = await fetch('/api/blockchain/verify-integrity/SURVEY_001', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    databaseHash: 'demo_hash_123'
  })
});
```

## 🚨 Troubleshooting

### Common Issues

1. **"Blockchain service not initialized"**
   - Check environment variables
   - Ensure private key is correct
   - Verify RPC URL is accessible

2. **"Insufficient funds"**
   - Get more test MATIC from faucet
   - Check wallet balance

3. **"Contract not found"**
   - Verify contract address in .env
   - Ensure contract is deployed to Mumbai testnet

4. **"Gas estimation failed"**
   - Check gas configuration
   - Verify network connectivity

### Debug Commands

```bash
# Check blockchain service status
curl http://localhost:5000/api/blockchain/health

# Check network status (requires auth)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/blockchain/status

# Test survey search
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/blockchain/search/SURVEY_001
```

## 📊 Monitoring & Analytics

### 1. Transaction Tracking

- All blockchain transactions are logged
- Check backend console for transaction hashes
- Monitor on Mumbai Polygonscan

### 2. Gas Optimization

- Current gas limit: 3,000,000
- Max priority fee: 2 gwei
- Max fee: 50 gwei

### 3. Performance Metrics

- Transaction confirmation time
- Gas usage per operation
- Network latency

## 🔐 Security Considerations

### 1. Private Key Management

- Never commit private keys to version control
- Use environment variables
- Consider hardware wallets for production

### 2. Access Control

- Only authorized officers can create/update records
- JWT authentication required for all endpoints
- Role-based access control implemented

### 3. Data Integrity

- All changes generate new hashes
- Previous hashes are preserved
- Timeline events are immutable

## 🚀 Production Deployment

### 1. Mainnet Considerations

- Use Polygon mainnet instead of Mumbai
- Higher gas costs
- Real MATIC tokens required
- Enhanced security measures

### 2. Scaling

- Consider L2 solutions for high throughput
- Implement batch operations
- Optimize gas usage

### 3. Monitoring

- Set up alerts for failed transactions
- Monitor gas prices
- Track contract events

## 📚 Additional Resources

- [Polygon Documentation](https://docs.polygon.technology/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review backend logs
3. Verify blockchain configuration
4. Test with Mumbai testnet first

---

**Note**: This system is designed for demonstration and development. For production use, implement additional security measures and thorough testing.

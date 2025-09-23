# Polygon Testnet Setup Guide for SARAL Bhoomi

This guide will help you deploy your enhanced DeLand application to Polygon Mumbai testnet with comprehensive blockchain features.

## 🚀 Prerequisites

### 1. Required Software
- Node.js (v16 or higher)
- npm or yarn
- Git
- MetaMask wallet extension

### 2. Required Accounts & Keys
- **MetaMask Wallet**: For managing transactions and gas fees
- **Private Key**: Your wallet's private key (keep this secret!)
- **Polygonscan API Key**: For contract verification (optional but recommended)

## 📋 Setup Steps

### Step 1: Install Dependencies

Navigate to the contracts directory and install dependencies:

```bash
cd saral-bhoomi/contracts
npm install
```

### Step 2: Configure Environment Variables

1. Copy the environment example file:
```bash
cp env.example .env
```

2. Edit `.env` file with your actual values:
```env
# Polygon Mumbai Testnet RPC URL
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com

# Your private key (keep this secret!)
PRIVATE_KEY=your_actual_private_key_here

# Contract address (will be filled after deployment)
CONTRACT_ADDRESS=

# Polygonscan API key for contract verification
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here

# Gas settings (optional)
GAS_LIMIT=3000000
GAS_PRICE=auto

# Network configuration
NETWORK=mumbai
CHAIN_ID=80001
```

### Step 3: Get Test MATIC

1. Visit [Polygon Faucet](https://faucet.polygon.technology/)
2. Connect your MetaMask wallet
3. Request test MATIC (you'll need at least 0.1 MATIC for deployment)

### Step 4: Deploy Smart Contract

1. **Compile the contract:**
```bash
npm run compile
```

2. **Deploy to Mumbai testnet:**
```bash
npm run deploy:mumbai
```

3. **Save the contract address** from the deployment output

4. **Update your .env file** with the contract address:
```env
CONTRACT_ADDRESS=0x... # Your deployed contract address
```

### Step 5: Verify Contract on Polygonscan

1. Visit [Mumbai Polygonscan](https://mumbai.polygonscan.com/)
2. Search for your contract address
3. Click "Contract" tab
4. Click "Verify and Publish"
5. Use the verification command from deployment output

### Step 6: Update Backend Configuration

1. **Update backend environment variables:**
```env
# Add to your backend .env file
CONTRACT_ADDRESS=your_contract_address_here
PRIVATE_KEY=your_private_key_here
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com
```

2. **Install blockchain dependencies in backend:**
```bash
cd ../backend
npm install ethers@^6.11.1
```

## 🔧 Testing the Setup

### 1. Test Smart Contract Functions

```bash
cd contracts
npm run test
```

### 2. Test Backend Blockchain Service

```bash
cd ../backend
node -e "
const blockchainService = require('./services/blockchainService.js');
blockchainService.getNetworkStatus().then(console.log);
"
```

### 3. Test Frontend Integration

1. Start your frontend application
2. Navigate to the blockchain features
3. Test creating new land entries
4. Test viewing property timelines

## 📱 Frontend Integration

### 1. Add New Components to Routes

Update your routing configuration to include the new blockchain components:

```tsx
// In your main App.tsx or routing file
import PropertyHistoryTimeline from './components/saral/officer/PropertyHistoryTimeline';
import AddLandLedgerEntry from './components/saral/officer/AddLandLedgerEntry';

// Add routes
<Route path="/property-timeline" element={<PropertyHistoryTimeline />} />
<Route path="/add-land-entry" element={<AddLandLedgerEntry />} />
```

### 2. Update Navigation

Add blockchain-related navigation items to your main navigation:

```tsx
// Add to your navigation menu
{
  name: 'Blockchain Features',
  items: [
    { name: 'Property Timeline', href: '/property-timeline' },
    { name: 'Add Land Entry', href: '/add-land-entry' },
    { name: 'Blockchain Dashboard', href: '/blockchain-dashboard' }
  ]
}
```

## 🔍 Key Features Implemented

### 1. Comprehensive Hash Generation
- **Survey Data Hash**: Combines all survey-related information
- **Block Hash**: Combines event data with previous hash
- **Chain Integrity**: Each block links to the previous one

### 2. Timeline Preservation
- **Event History**: Complete chronological record of all changes
- **Data Integrity**: Each event includes comprehensive metadata
- **Visual Timeline**: Frontend displays events in chronological order

### 3. Blockchain Integration
- **Polygon Mumbai**: Deployed on Polygon testnet
- **Gas Estimation**: Real-time gas cost calculation
- **Transaction Verification**: All changes recorded on blockchain

### 4. Notice Generation Integration
- **Event Types**: Includes "Notice Generated" as an event type
- **Metadata Preservation**: All notice details preserved in timeline
- **Hash Updates**: New hash generated for each notice

## 🚨 Important Security Notes

### 1. Private Key Security
- **NEVER** commit private keys to version control
- Use environment variables for sensitive data
- Consider using hardware wallets for production

### 2. Network Security
- Always verify you're on the correct network
- Use testnet for development and testing
- Mainnet only for production deployment

### 3. Contract Security
- Review smart contract code thoroughly
- Test all functions before mainnet deployment
- Consider professional audit for production

## 🔧 Troubleshooting

### Common Issues

1. **"Insufficient funds" error**
   - Get more test MATIC from faucet
   - Check wallet balance

2. **"Contract not found" error**
   - Verify contract address is correct
   - Check if contract is deployed to correct network

3. **"Gas estimation failed" error**
   - Check RPC URL is accessible
   - Verify contract ABI matches deployed contract

4. **"Transaction failed" error**
   - Check gas limit is sufficient
   - Verify you have enough MATIC for gas

### Debug Commands

```bash
# Check network status
npx hardhat console --network mumbai
> const provider = ethers.provider
> provider.getNetwork()

# Check contract deployment
npx hardhat verify --network mumbai CONTRACT_ADDRESS

# Test contract functions
npx hardhat test
```

## 📊 Monitoring & Analytics

### 1. Polygonscan Dashboard
- Monitor contract transactions
- View gas usage statistics
- Track contract interactions

### 2. Application Logs
- Monitor blockchain service logs
- Track transaction success/failure rates
- Monitor gas estimation accuracy

### 3. Performance Metrics
- Transaction confirmation times
- Gas cost optimization
- User interaction patterns

## 🚀 Next Steps

### 1. Production Deployment
- Deploy to Polygon mainnet
- Implement additional security measures
- Set up monitoring and alerting

### 2. Feature Enhancements
- Multi-signature transactions
- Advanced access control
- Integration with other blockchains

### 3. User Experience
- Mobile app development
- Offline transaction support
- Advanced search and filtering

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Polygon documentation
3. Check contract deployment logs
4. Verify environment configuration

## 🔗 Useful Links

- [Polygon Documentation](https://docs.polygon.technology/)
- [Mumbai Testnet Explorer](https://mumbai.polygonscan.com/)
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

---

**Note**: This guide covers the basic setup. For production deployment, consider additional security measures, testing, and professional auditing.

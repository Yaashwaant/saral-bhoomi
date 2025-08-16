# SARAL Bhoomi Blockchain Integration

This directory contains the smart contracts and blockchain integration for the SARAL Bhoomi land records system.

## 🏗️ Architecture

The system uses Polygon Mumbai testnet for blockchain integration, providing:
- **Transparency**: All land record events are stored on-chain
- **Immutability**: Once recorded, events cannot be tampered with
- **Traceability**: Complete audit trail for every survey number
- **Cost-effective**: Polygon's low gas fees make it suitable for government applications

## 📁 Files

- `LandRecordsContract.sol` - Main smart contract for land records tracking
- `deploy.js` - Deployment script for Polygon Mumbai testnet
- `hardhat.config.js` - Hardhat configuration for development and deployment
- `package.json` - Dependencies and scripts for contract development

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v16 or higher)
2. **npm** or **yarn**
3. **MetaMask** wallet with Mumbai testnet configured
4. **MATIC tokens** for gas fees (get from [Mumbai Faucet](https://faucet.polygon.technology/))

### Installation

```bash
cd contracts
npm install
```

### Environment Setup

Create a `.env` file in the contracts directory:

```env
# Private key of the deployer wallet (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Polygon Mumbai RPC URL
POLYGON_RPC_URL=https://rpc-mumbai.maticvigil.com

# PolygonScan API key for contract verification
POLYGONSCAN_API_KEY=your_polygonscan_api_key

# Contract address (will be filled after deployment)
CONTRACT_ADDRESS=
```

### Compile Contracts

```bash
npm run compile
```

### Deploy to Mumbai Testnet

```bash
npm run deploy:mumbai
```

### Verify Contract

After deployment, verify the contract on PolygonScan:

```bash
npm run verify:mumbai
```

## 🔧 Smart Contract Features

### Core Functions

1. **updateLandRecord** - Record new land events
2. **getLandRecord** - Retrieve all events for a survey number
3. **verifyRecord** - Verify record integrity
4. **registerOfficer** - Register new field officers
5. **setOfficerStatus** - Activate/deactivate officers

### Event Types

- `JMR_Measurement_Uploaded` - JMR measurement completed
- `Notice_Generated` - Notice slip created
- `Payment_Slip_Created` - Payment slip generated
- `Payment_Released` - Payment processed successfully
- `Payment_Pending` - Payment pending with reason
- `Payment_Failed` - Payment failed
- `Ownership_Updated` - Land ownership changed
- `Award_Declared` - Land acquisition award declared
- `Compensated` - Compensation payment completed

## 🌐 Network Configuration

### Mumbai Testnet
- **Chain ID**: 80001
- **RPC URL**: https://rpc-mumbai.maticvigil.com
- **Explorer**: https://mumbai.polygonscan.com
- **Currency**: MATIC (testnet)

### Local Development
- **Chain ID**: 1337
- **RPC URL**: http://127.0.0.1:8545
- **Currency**: ETH (local)

## 📊 Gas Estimation

Typical gas costs for operations:
- **updateLandRecord**: ~50,000 - 80,000 gas
- **registerOfficer**: ~100,000 - 150,000 gas
- **setOfficerStatus**: ~30,000 - 50,000 gas

## 🔒 Security Features

- **Access Control**: Only authorized officers can update records
- **Reentrancy Protection**: Prevents reentrancy attacks
- **Input Validation**: Comprehensive parameter validation
- **Emergency Functions**: Owner can invalidate compromised records

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Start local blockchain:

```bash
npm run node
```

## 📝 Integration with Backend

The backend service (`blockchainService.js`) integrates with this smart contract to:

1. **Create Blocks**: Automatically create blockchain entries for all land record events
2. **Verify Integrity**: Check blockchain integrity for survey numbers
3. **Gas Estimation**: Provide gas cost estimates for operations
4. **Network Status**: Monitor blockchain network health

## 🚨 Important Notes

1. **Testnet Only**: This is deployed on Mumbai testnet for development
2. **Gas Fees**: Ensure sufficient MATIC for deployment and operations
3. **Private Key Security**: Never commit private keys to version control
4. **Contract Verification**: Always verify contracts on PolygonScan after deployment

## 🔗 Useful Links

- [Polygon Documentation](https://docs.polygon.technology/)
- [Mumbai Faucet](https://faucet.polygon.technology/)
- [PolygonScan Mumbai](https://mumbai.polygonscan.com/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## 🆘 Support

For issues with blockchain integration:
1. Check network connectivity
2. Verify gas fees and wallet balance
3. Ensure correct network configuration
4. Check contract deployment status

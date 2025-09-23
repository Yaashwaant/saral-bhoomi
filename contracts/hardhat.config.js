// saral-bhoomi/contracts/hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    // Primary testnet - Polygon Amoy (DRPC - most reliable)
    amoy: {
      url: process.env.POLYGON_RPC_URL || "https://polygon-amoy.drpc.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gas: 5000000,
      gasPrice: "auto",
      timeout: 60000, // 60 seconds timeout
      // Override any gas caps
      maxFeePerGas: "100000000000", // 100 gwei
      maxPriorityFeePerGas: "2000000000", // 2 gwei
    },
    // Alternative Amoy RPC (Ankr - very reliable)
    amoy_alt: {
      url: "https://rpc.ankr.com/polygon_amoy",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gas: 5000000,
      gasPrice: "auto",
      timeout: 60000,
    },
    // Third alternative (QuickNode style)
    amoy_quick: {
      url: "https://amoy.polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
      gas: 5000000,
      gasPrice: "auto",
      timeout: 60000,
    },
    polygon: {
      url: process.env.POLYGON_MAINNET_RPC_URL || "https://polygon-rpc.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: "auto",
      gas: "auto",
    },
  },
  etherscan: {
    apiKey: {
      // Single API key for all networks
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.ETHERSCAN_API_KEY || "",
      amoy: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      goerli: process.env.ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api.etherscan.io/api",
          browserURL: "https://www.oklink.com/amoy"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 40000,
  },
};
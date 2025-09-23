// saral-bhoomi/contracts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of LandRecordsContract...");

  try {
    // Get the contract factory
    const LandRecordsContract = await ethers.getContractFactory("LandRecordsContract");
    console.log("📜 Contract factory loaded");

    // Deploy the contract
    console.log("⛏️ Deploying contract...");
    const landRecordsContract = await LandRecordsContract.deploy();
    
    // Wait for deployment to complete
    await landRecordsContract.waitForDeployment();
    
    const contractAddress = await landRecordsContract.getAddress();
    console.log("✅ LandRecordsContract deployed to:", contractAddress);

    // Get deployment transaction details
    const deploymentTx = landRecordsContract.deploymentTransaction();
    if (deploymentTx) {
      console.log("📋 Deployment transaction hash:", deploymentTx.hash);
      console.log("💰 Gas used:", deploymentTx.gasLimit.toString());
    }

    // Verify the contract is working
    console.log("�� Verifying contract functionality...");
    
    // Check if deployer is authorized officer
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    const isAuthorized = await landRecordsContract.isAuthorizedOfficer(deployerAddress);
    console.log("👤 Deployer authorized status:", isAuthorized);

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network deployed to:", network.name);
    console.log("🔗 Chain ID:", network.chainId);

    // Save deployment info
    const deploymentInfo = {
      contractName: "LandRecordsContract",
      contractAddress: contractAddress,
      deployer: deployerAddress,
      network: network.name,
      chainId: network.chainId,
      deploymentTime: new Date().toISOString(),
      transactionHash: deploymentTx?.hash || "N/A",
      gasUsed: deploymentTx?.gasLimit?.toString() || "N/A"
    };

    console.log("\n�� Deployment Summary:");
    console.log("=========================");
    console.log("Contract:", deploymentInfo.contractName);
    console.log("Address:", deploymentInfo.contractAddress);
    console.log("Network:", deploymentInfo.network);
    console.log("Chain ID:", deploymentInfo.chainId);
    console.log("Deployer:", deploymentInfo.deployer);
    console.log("Deployment Time:", deploymentInfo.deploymentTime);
    console.log("Transaction Hash:", deploymentInfo.transactionHash);
    console.log("Gas Used:", deploymentInfo.gasUsed);

    // Instructions for next steps
    console.log("\n�� Next Steps:");
    console.log("1. Save the contract address for frontend integration");
    console.log("2. Update your .env file with CONTRACT_ADDRESS=" + contractAddress);
    console.log("3. Verify the contract on OKLink (if on Amoy testnet)");
    console.log("4. Test the contract functions");
    
    if (network.chainId === 80002) { // Amoy testnet
      console.log("\n🔍 To verify on OKLink Amoy:");
      console.log(`npx hardhat verify --network amoy ${contractAddress}`);
      console.log("�� Explorer: https://www.oklink.com/amoy");
    } else if (network.chainId === 137) { // Polygon mainnet
      console.log("\n🔍 To verify on Polygon mainnet Polygonscan:");
      console.log(`npx hardhat verify --network polygon ${contractAddress}`);
    }

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Execute deployment
main()
  .then((deploymentInfo) => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Deployment failed:", error);
    process.exit(1);
  });
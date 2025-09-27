// saral-bhoomi/contracts/deploy-land-record.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of LandRecord contract...");

  try {
    // Get the contract factory
    const LandRecord = await ethers.getContractFactory("LandRecord");
    console.log("📜 Contract factory loaded");

    // Deploy the contract
    console.log("⛏️ Deploying contract...");
    const landRecord = await LandRecord.deploy();
    
    // Wait for deployment to complete
    await landRecord.waitForDeployment();
    
    const contractAddress = await landRecord.getAddress();
    console.log("✅ LandRecord deployed to:", contractAddress);

    // Get deployment transaction details
    const deploymentTx = landRecord.deploymentTransaction();
    if (deploymentTx) {
      console.log("📋 Deployment transaction hash:", deploymentTx.hash);
      console.log("💰 Gas used:", deploymentTx.gasLimit.toString());
    }

    // Get the deployer and grant OFFICER_ROLE
    const [deployer] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    
    console.log("🔑 Granting OFFICER_ROLE to deployer...");
    const OFFICER_ROLE = await landRecord.OFFICER_ROLE();
    const grantRoleTx = await landRecord.grantRole(OFFICER_ROLE, deployerAddress);
    await grantRoleTx.wait();
    console.log("✅ OFFICER_ROLE granted to:", deployerAddress);

    // Get network information
    const network = await ethers.provider.getNetwork();
    console.log("🌐 Network deployed to:", network.name);
    console.log("🔗 Chain ID:", network.chainId);

    // Save deployment info
    const deploymentInfo = {
      contractName: "LandRecord",
      contractAddress: contractAddress,
      deployer: deployerAddress,
      network: network.name,
      chainId: network.chainId,
      deploymentTime: new Date().toISOString(),
      transactionHash: deploymentTx?.hash || "N/A",
      gasUsed: deploymentTx?.gasLimit?.toString() || "N/A",
      officerRoleGranted: true
    };

    console.log("\n📋 Deployment Summary:");
    console.log("=========================");
    console.log("Contract:", deploymentInfo.contractName);
    console.log("Address:", deploymentInfo.contractAddress);
    console.log("Network:", deploymentInfo.network);
    console.log("Chain ID:", deploymentInfo.chainId);
    console.log("Deployer:", deploymentInfo.deployer);
    console.log("Deployment Time:", deploymentInfo.deploymentTime);
    console.log("Transaction Hash:", deploymentInfo.transactionHash);
    console.log("Gas Used:", deploymentInfo.gasUsed);
    console.log("Officer Role Granted:", deploymentInfo.officerRoleGranted);

    // Instructions for next steps
    console.log("\n📋 Next Steps:");
    console.log("1. Save the contract address for frontend integration");
    console.log("2. Update your .env file with LAND_RECORD_CONTRACT_ADDRESS=" + contractAddress);
    console.log("3. Test the authorisedUpdate function");
    
    if (network.chainId === 80002) { // Amoy testnet
      console.log("\n🔍 To verify on OKLink Amoy:");
      console.log(`npx hardhat verify --network amoy ${contractAddress}`);
      console.log("🔗 Explorer: https://www.oklink.com/amoy");
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
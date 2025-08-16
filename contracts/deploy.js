const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying LandRecordsContract to Polygon Mumbai testnet...");

  // Get the contract factory
  const LandRecordsContract = await ethers.getContractFactory("LandRecordsContract");

  // Deploy the contract
  const landRecordsContract = await LandRecordsContract.deploy();
  await landRecordsContract.waitForDeployment();

  const contractAddress = await landRecordsContract.getAddress();
  console.log(`✅ LandRecordsContract deployed to: ${contractAddress}`);

  // Verify the deployment
  console.log("🔍 Verifying contract deployment...");
  
  try {
    await hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: [],
    });
    console.log("✅ Contract verified on PolygonScan");
  } catch (error) {
    console.log("⚠️ Contract verification failed:", error.message);
  }

  // Log deployment information
  console.log("\n📋 Deployment Summary:");
  console.log(`   Contract: LandRecordsContract`);
  console.log(`   Network: Polygon Mumbai Testnet`);
  console.log(`   Address: ${contractAddress}`);
  console.log(`   Deployer: ${await landRecordsContract.signer.getAddress()}`);
  
  // Save deployment info to file
  const deploymentInfo = {
    contractName: "LandRecordsContract",
    network: "Polygon Mumbai Testnet",
    address: contractAddress,
    deployer: await landRecordsContract.signer.getAddress(),
    deploymentTime: new Date().toISOString(),
    chainId: 80001,
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    explorer: "https://mumbai.polygonscan.com"
  };

  const fs = require('fs');
  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("💾 Deployment info saved to deployment-info.json");
  
  // Instructions for next steps
  console.log("\n📝 Next Steps:");
  console.log("   1. Update your .env file with the contract address:");
  console.log(`      CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Fund the contract with some MATIC for gas fees");
  console.log("   3. Test the contract functions on Mumbai testnet");
  console.log("   4. View the contract on PolygonScan:");
  console.log(`      https://mumbai.polygonscan.com/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

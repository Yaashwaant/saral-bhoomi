const LandRecord = artifacts.require("LandRecord");

module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(LandRecord);
  const lr = await LandRecord.deployed();
  // give the first officer role to the deployer so backend can send tx
  await lr.grantRole(await lr.OFFICER_ROLE(), accounts[0]);
};
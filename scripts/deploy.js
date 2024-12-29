const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // Deploy the DiamondCutFacet
  console.log("Deploying DiamondCutFacet...");
  const DiamondCutFacetFactory = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacetFactory.deploy();
  await diamondCutFacet.waitForDeployment(); // Updated for ethers v6+
  console.log("DiamondCutFacet deployed to:", diamondCutFacet.target);

  // Prepare DiamondArgs
  const [owner] = await ethers.getSigners(); // Updated to retrieve the deployer
  const args = {
    owner: owner.address, // Use the address of the deployer
    init: ethers.ZeroAddress, // No initializer contract
    initCalldata: "0x", // No calldata
  };

  // Deploy the Diamond contract
  console.log("Deploying Diamond...");
  const DiamondFactory = await ethers.getContractFactory("Diamond");
  const diamond = await DiamondFactory.deploy([], args);
  await diamond.waitForDeployment(); // Updated for ethers v6+
  console.log("Diamond deployed to:", diamond.target);

  console.log("Deployment finished successfully.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });

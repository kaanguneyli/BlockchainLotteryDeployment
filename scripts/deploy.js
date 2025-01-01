const { ethers } = require("hardhat");
const fs = require("fs");

async function saveDeploymentInfo(addresses) {
    const filePath = "./deployedAddresses.json";
    const data = JSON.stringify(addresses, null, 2);
    fs.writeFileSync(filePath, data, { flag: "w" });
    console.log("Deployment info saved to deployedAddresses.json");
}

async function main() {
    console.log("Starting deployment...");
    const deploymentAddresses = {};

    // List of facets to deploy
    const facets = ["DiamondLoupeFacet", "OwnershipFacet", "LotteryFacet", "AdminFacet", "QueryFacet"];

    // Deploy DiamondCutFacet
    console.log("Deploying DiamondCutFacet...");
    const DiamondCutFacetFactory = await ethers.getContractFactory("DiamondCutFacet");
    const diamondCutFacet = await DiamondCutFacetFactory.deploy();
    await diamondCutFacet.waitForDeployment();
    deploymentAddresses.DiamondCutFacet = diamondCutFacet.target;
    console.log("DiamondCutFacet deployed to:", diamondCutFacet.target);

    // Deploy Diamond
    console.log("Deploying Diamond...");
    const [owner] = await ethers.getSigners();
    const args = {
        owner: owner.address,
        init: ethers.ZeroAddress,
        initCalldata: "0x",
    };
    const DiamondFactory = await ethers.getContractFactory("Diamond");
    const diamond = await DiamondFactory.deploy([], args);
    await diamond.waitForDeployment();
    deploymentAddresses.Diamond = diamond.target;
    console.log("Diamond deployed to:", diamond.target);

    // Deploy and Attach Facets
    const diamondCut = [];

    for (const facetName of facets) {
        console.log(`Deploying ${facetName}...`);
        const FacetFactory = await ethers.getContractFactory(facetName);
        const facet = await FacetFactory.deploy();
        await facet.waitForDeployment();
        console.log(`${facetName} deployed to:`, facet.target);
        deploymentAddresses[facetName] = facet.target;

        const selectors = facet.interface.functions
            ? Object.keys(facet.interface.functions).map(fn => facet.interface.getSighash(fn))
            : [];
        console.log(`Selectors for ${facetName}:`, selectors);

        diamondCut.push({
            facetAddress: facet.target,
            action: 0, // Add action
            functionSelectors: selectors,
        });
    }

    console.log("Adding facets to the Diamond contract...");
    const diamondCutFacetInstance = await ethers.getContractAt("DiamondCutFacet", diamond.target);
    const tx = await diamondCutFacetInstance.diamondCut(diamondCut, ethers.ZeroAddress, "0x");
    await tx.wait();
    console.log("All facets added successfully.");

    // Save deployment info
    await saveDeploymentInfo(deploymentAddresses);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error during deployment:", error);
        process.exit(1);
    });

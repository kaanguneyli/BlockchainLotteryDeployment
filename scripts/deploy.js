/* global ethers */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");

async function deployDiamond(flag) {
  const accounts = await ethers.getSigners();
  const contractOwner = accounts[0];

  console.log("Deploying contracts with the account:", contractOwner.address);

  //let flag = "log" ;
  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.deployed();
  if (flag === "log")
    console.log("DiamondCutFacet deployed:", diamondCutFacet.address);

  // deploy Diamond
  const Diamond = await ethers.getContractFactory("Diamond");

  const diamondCut2 = [
    {
      facetAddress: diamondCutFacet.address,
      action: FacetCutAction.Add, // Add action
      functionSelectors: getSelectors(diamondCutFacet), // Get selectors from facet
    },
  ];

  const args = {
      owner: contractOwner.address,           // Address of the contract owner
      init: ethers.constants.AddressZero,    // Use AddressZero for no initialization
      initCalldata: "0x",                    // Empty calldata
  };
  const diamond = await Diamond.deploy(diamondCut2, args);
  await diamond.deployed();
  
  console.log("Diamond deployed to:", diamond.address);
  
  if (flag === "log") console.log("Diamond deployed:", diamond.address);

  // deploy DiamondInit
  // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
  // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
  const DiamondInit = await ethers.getContractFactory("DiamondInit");
  const diamondInit = await DiamondInit.deploy();
  await diamondInit.deployed();
  if (flag === "log") console.log("DiamondInit deployed:", diamondInit.address);

  // deploy facets
  if (flag === "log") console.log("");
  if (flag === "log") console.log("Deploying facets");
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "LotteryFacet",
  ];
  const cut = [];
  const selectors = new Set(); // Define selectors set here
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName);
    let facet;
    // if (FacetName === "TestTokenFacet") {
      // facet = await Facet.deploy(1000000); // Provide the initial supply argument
    // } else {
      facet = await Facet.deploy();
    // }
    await facet.deployed();
    if (flag === "log") console.log(`${FacetName} deployed: ${facet.address}`);

    const facetSelectors = getSelectors(facet);
    const uniqueSelectors = [];
    for (const selector of facetSelectors) {
      if (selectors.has(selector)) {
        console.error(
          `Duplicate function selector found: ${selector} in ${FacetName}`
        );
      } else {
        selectors.add(selector);
        uniqueSelectors.push(selector);
      }
    }

    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    });
  }

  // upgrade diamond with facets
  if (flag === "log") console.log("");
  if (flag === "log") console.log("Diamond Cut:", cut);
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
  let tx;
  let receipt;
  // call to init function
  const functionCall = diamondInit.interface.encodeFunctionData("init");

  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);

  if (flag === "log") console.log("Diamond cut tx: ", tx.hash);
  receipt = await tx.wait();
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  if (flag === "log") console.log("Completed diamond cut");
  return diamond.address;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond("log")
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployDiamond = deployDiamond;
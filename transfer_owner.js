const { ethers } = require("hardhat");

async function main() {
  // Connect with the owner's account that deployed the contract
  const ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
  );

  // Your MetaMask address
  const newOwner = "0x2a3bC46Df6554Dd668959F7B94b1e990A76d0F06";
  
  // Transfer ownership (must be called by current owner)
  const tx = await ownershipFacet.transferOwnership(newOwner);
  await tx.wait();
  
  console.log("Ownership transferred to:", newOwner);
}

main()
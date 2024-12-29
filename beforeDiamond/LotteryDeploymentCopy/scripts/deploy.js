const { ethers } = require("hardhat");

async function main() {

  // Get the TestToken contract factory
  const TestToken = await ethers.getContractFactory("TestToken");

  // Deploy TestToken
  const testToken = await TestToken.deploy();

  // Wait for deployment to complete
  await testToken.waitForDeployment();
  console.log("TestToken deployed to:", testToken.target);

  // Deploy CompanyLotteries contract
  const CompanyLotteries = await ethers.getContractFactory("CompanyLotteries");
  const companyLotteries = await CompanyLotteries.deploy();

  // Wait for deployment to complete
  await companyLotteries.waitForDeployment();
  console.log("CompanyLotteries deployed to:", companyLotteries.target);

  // Set the TestToken as the payment token
  console.log("Setting payment token...");
  const tx = await companyLotteries.setPaymentToken(testToken.target);
  await tx.wait();
  console.log("Payment token set to:", testToken.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in deployment:", error);
    process.exit(1);
  });

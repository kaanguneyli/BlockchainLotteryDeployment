require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

module.exports = {
  solidity: "0.8.27",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    bloxberg: {
      url: "https://core.bloxberg.org",
      accounts: [process.env.PRIVATE_KEY], // Ensure this is set in your .env file
    },
    sepolia: {
      url: process.env.API_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};

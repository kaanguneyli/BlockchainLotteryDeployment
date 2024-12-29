require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.28", // Replace with the Solidity version of your project
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Local Hardhat node
    },
    bloxberg: {
      url: "https://core.bloxberg.org",
      accounts: [process.env.PRIVATE_KEY], // Replace with your MetaMask private key
    },
  },
};

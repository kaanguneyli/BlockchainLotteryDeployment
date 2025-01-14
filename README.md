# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

To run the web UI, navigate to our fronted folder and run as follows:

```
cd frontend
npm start
```

If you are missing dependencies, make sure to run 

```
npm install
npm install ethers@5.7.2
```

You may also try running some of the following commands:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

For deployment, first connect to the node, then deploy the diamond contract itself. 

```
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```


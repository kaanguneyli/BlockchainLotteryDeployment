# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```



First connect to the node,  then deploy the diamond. 

```
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

Then you need to get the address of the diamond contract and paste it to the frontend (IDK if we need to change this)

Then you will need eth to run the functions, currently I am getting the tokens from the local hardhat 100000 ether but we gotta change it @kaan

Add a new account --> import in --> paste the private key from the node --> then send the money to your actual account

!!! I change the owner with change_owner.js but dont know if you need that we can test it. currently in the main branch (I guess) !!!

if something goes wrong with error 343 sth sth then reset you nuance from the main account

Then you are good to go, check the console

const { ethers } = require("hardhat");
const { expect } = require("chai");
const { keccak256, defaultAbiCoder } = ethers.utils;


describe("LotteryFacet", function () {
    let companyLotteries, testToken;
    let owner, user;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
    
        // Deploy TestToken contract
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy();
        await testToken.deployed();
        console.log("TestToken deployed at:", testToken.address);
    
        // Deploy LotteryFacet contract with required arguments
        const LotteryFacet = await ethers.getContractFactory("LotteryFacet");
        companyLotteries = await LotteryFacet.deploy();
    
        // Ensure LotteryFacet is deployed successfully
        console.log("LotteryFacet deployed to:", companyLotteries.address);

        // Set the payment token using the owner address
        await companyLotteries.connect(owner).setPaymentToken(testToken.address);
    });

    it("should create a lottery", async () => {
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // Current time + 1000 seconds
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = 100;
        const htmlHash = ethers.constants.HashZero; // equivalent of 0x0
        const url = "https://example.com";

        // Create a lottery
        const tx = await companyLotteries.createLottery(
            unixEnd,
            noOfTickets,
            noOfWinners,
            minPercentage,
            ticketPrice,
            htmlHash,
            url
        );

        // Wait for the transaction to complete
        const receipt = await tx.wait();

        // Validate lottery creation (checking lotteryCount)
        var lotteryNo = await companyLotteries.getLotteryCount();
        expect(lotteryNo.toNumber()).to.equal(1);

        // Validate event emission
        const lotteryCreatedEvent = receipt.events.find(event => event.event === "LotteryCreated");
        expect(lotteryCreatedEvent).to.not.be.undefined;
        expect(lotteryCreatedEvent.args.lottery_no.toNumber()).to.equal(1);
    });

    it("should fail to create a lottery with an ending time in the past", async () => {
        const unixEnd = Math.floor(Date.now() / 1000) - 1000; // Current time - 1000 seconds (in the past)
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = 100;
        const htmlHash = ethers.constants.HashZero; // equivalent of 0x0
        const url = "https://example.com";
    
        try {
            await companyLotteries.createLottery(
                unixEnd,
                noOfTickets,
                noOfWinners,
                minPercentage,
                ticketPrice,
                htmlHash,
                url
            );
            // If the above line doesn't throw, fail the test
            assert.fail("The transaction did not revert as expected.");
        } catch (error) {
            // Check if the revert message is present in the error
            expect(error.message).to.include("End time must be in the future");
        }
    });

    it("should fail to create a lottery with min percentage higher than 100", async () => {
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // Current time + 1000 seconds
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 200; // Invalid percentage
        const ticketPrice = 100;
        const htmlHash = ethers.constants.HashZero; // equivalent of 0x0
        const url = "https://example.com";
    
        let error;
    
        try {
            // Trying to create a lottery with invalid minPercentage
            await companyLotteries.createLottery(
                unixEnd,
                noOfTickets,
                noOfWinners,
                minPercentage,
                ticketPrice,
                htmlHash,
                url
            );
        } catch (err) {
            error = err; // Catching the error
        }
    
        // Check if the error message contains the expected revert message
        expect(error).to.be.an("error");
        expect(error.message).to.include("Invalid percentage");
    });
    
    it("should create a lottery with random values within valid ranges", async function () {
        // Setup: get the current time to ensure the lottery end time is in the future
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Generate random values for testing, ensuring they meet the constraints
        const unixEnd = currentTime + Math.floor(Math.random() * 10000); // Unix time in the future
        const noOfTickets = Math.floor(Math.random() * 1000) + 1; // Random ticket count between 1 and 1000
        const noOfWinners = Math.floor(Math.random() * noOfTickets) + 1; // Winners cannot exceed tickets
        const minPercentage = Math.floor(Math.random() * 101); // Between 0 and 100
        const ticketPrice = Math.floor(Math.random() * 1000) + 1; // Random ticket price between 1 and 1000
        const htmlHash = ethers.constants.HashZero; // Can be a placeholder value for testing
        const url = "https://example.com"; // Random URL for the test
    
        // Ensure minPercentage is between 0 and 100, and unixEnd is in the future
        expect(minPercentage).to.be.at.least(0).and.at.most(100);
        expect(unixEnd).to.be.greaterThan(currentTime);
    
        // Create lottery
        companyLotteries.createLottery(
          unixEnd,
          noOfTickets,
          noOfWinners,
          minPercentage,
          ticketPrice,
          htmlHash,
          url
        );
        var lotteryNo = await companyLotteries.getLotteryCount();
        expect(lotteryNo.toNumber()).to.equal(1);
      });

      it("should allow a user to buy a ticket", async function () {
        // Define lottery parameters
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // End time 1000 seconds from now
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = ethers.utils.parseEther("1");
        const htmlHash = ethers.constants.HashZero;
        const url = "https://example.com";
    
        // Create the lottery as the owner
        await companyLotteries
          .connect(owner)
          .createLottery(unixEnd, noOfTickets, noOfWinners, minPercentage, ticketPrice, htmlHash, url);
    
        // Mint and approve tokens for the user
        await testToken.connect(owner).mint(user.address, ethers.utils.parseEther("10"));
        await testToken.connect(user).approve(companyLotteries.address, ticketPrice);
    
        // Get the hashed random number
        const rndNumber = 123;
        const hashRndNumber = keccak256(defaultAbiCoder.encode(["address", "uint256"], [user.address, rndNumber]));
    
        // Buy a ticket as the user
        const tx = await companyLotteries
          .connect(user)
          .buyTicketTx(1, 1, hashRndNumber);
    
        // Wait for transaction to be mined
        const receipt = await tx.wait();
    
        // Check emitted event
        const event = receipt.events.find((e) => e.event === "TicketPurchased");
        expect(event.args.lottery_no.toNumber()).to.equal(1);
        expect(event.args.sticketno.toNumber()).to.equal(1);
        expect(event.args.buyer).to.equal(user.address);
        expect(event.args.quantity.toNumber()).to.equal(1);
    
            // Check contract balance
        const contractBalance = await testToken.balanceOf(companyLotteries.address);
        expect(contractBalance.toString()).to.eq(ticketPrice.toString());

        // Check user's balance (assuming they started with 10 tokens)
        const userBalance = await testToken.balanceOf(user.address);
        expect(userBalance.toString()).to.eq(ethers.utils.parseEther("9").toString());

      });

      it("should fail to buy a ticket with quantity exceeding ticket limit", async function () {
        // Define lottery parameters
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // End time 1000 seconds from now
        const noOfTickets = 50;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = ethers.utils.parseEther("1");
        const htmlHash = ethers.constants.HashZero;
        const url = "https://example.com";
    
        // Create the lottery as the owner
        await companyLotteries
            .connect(owner)
            .createLottery(unixEnd, noOfTickets, noOfWinners, minPercentage, ticketPrice, htmlHash, url);
    
        // Mint and approve tokens for the user
        await testToken.connect(owner).mint(user.address, ethers.utils.parseEther("100"));
        await testToken.connect(user).approve(companyLotteries.address, ethers.utils.parseEther("60"));
    
        // Define lottery and ticket parameters
        const lotteryNo = 1;
        const quantity = 30;
        const hashRndNumber = keccak256(defaultAbiCoder.encode(["uint256"], [123]));
    
        // Buy the first batch of tickets
        await companyLotteries.connect(user).buyTicketTx(lotteryNo, quantity, hashRndNumber);
    
        // Try to buy tickets again exceeding the limit using try-catch
        let error;
        try {
            await companyLotteries.connect(user).buyTicketTx(lotteryNo, quantity, hashRndNumber);
        } catch (err) {
            error = err;
        }
    
        // Check if the error contains the expected revert message
        expect(error).to.be.an("error");
        expect(error.message).to.include("Exceeds limit");
    });
    
    it("should fail to buy a ticket with quantity higher than 30", async function () {
        // Define lottery parameters
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // End time 1000 seconds from now
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = ethers.utils.parseEther("1");
        const htmlHash = ethers.constants.HashZero;
        const url = "https://example.com";
    
        // Create the lottery as the owner
        await companyLotteries
            .connect(owner)
            .createLottery(unixEnd, noOfTickets, noOfWinners, minPercentage, ticketPrice, htmlHash, url);
    
        // Mint and approve tokens for the user
        await testToken.connect(owner).mint(user.address, ethers.utils.parseEther("100"));
        await testToken.connect(user).approve(companyLotteries.address, ethers.utils.parseEther("31"));
    
        // Define lottery and ticket parameters
        const lotteryNo = 1;
        const quantity = 31; // Quantity higher than 30
        const hashRndNumber = keccak256(defaultAbiCoder.encode(["uint256"], [123]));
    
        // Try to buy tickets with quantity > 30 and expect a revert
        let error;
        try {
            await companyLotteries.connect(user).buyTicketTx(lotteryNo, quantity, hashRndNumber);
        } catch (err) {
            error = err;
        }
    
        // Check if the error contains the expected revert message
        expect(error).to.be.an("error");
        expect(error.message).to.include("Purchase up to 30 tickets only");
    });

    it("should fail to buy a ticket when the payment fails (insufficient balance)", async function () {
        // Define lottery parameters
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // End time 1000 seconds from now
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = ethers.utils.parseEther("1"); // 1 token per ticket
        const htmlHash = ethers.constants.HashZero;
        const url = "https://example.com";
    
        // Create the lottery as the owner
        await companyLotteries
            .connect(owner)
            .createLottery(unixEnd, noOfTickets, noOfWinners, minPercentage, ticketPrice, htmlHash, url);
    
        // Mint tokens to the user but not enough to cover the ticket price
        await testToken.connect(owner).mint(user.address, ethers.utils.parseEther("10")); // 10 tokens, not enough for the ticket price
    
        // Define lottery and ticket parameters
        const lotteryNo = 1;
        const quantity = 1;
        const hashRndNumber = keccak256(defaultAbiCoder.encode(["uint256"], [123]));
    
        // Try to buy a ticket but the payment should fail
        let error;
        try {
            await companyLotteries.connect(user).buyTicketTx(lotteryNo, quantity, hashRndNumber);
        } catch (err) {
            error = err;
        }
    
        // Check if the error contains the expected revert message
        expect(error).to.be.an("error");
        expect(error.message).to.include("Payment failed");
    });

    it("should allow fuzz testing for buyTicketTx with random values", async function () {
        // Define lottery parameters
        const unixEnd = Math.floor(Date.now() / 1000) + 1000; // End time 1000 seconds from now
        const noOfTickets = 100;
        const noOfWinners = 3;
        const minPercentage = 10;
        const ticketPrice = ethers.utils.parseEther("1"); // 1 token per ticket
        const htmlHash = ethers.constants.HashZero;
        const url = "https://example.com";
    
        // Create the lottery as the owner
        await companyLotteries
            .connect(owner)
            .createLottery(unixEnd, noOfTickets, noOfWinners, minPercentage, ticketPrice, htmlHash, url);
    
        // Mint and approve tokens for the user
        await testToken.connect(owner).mint(user.address, ethers.utils.parseEther("30"));
        await testToken.connect(user).approve(companyLotteries.address, ethers.utils.parseEther("30"));
    
        // Generate random values within the valid range
        const quantity = Math.floor(Math.random() * 30) + 1; // Quantity between 1 and 30
        const hashSeed = Math.floor(Math.random() * 10000); // Random seed for the hash
    
        // Ensure quantity is within the allowed range (1-30)
        expect(quantity).to.be.at.least(1).and.at.most(30);
    
        // Get the hashed random number
        const hashRndNumber = keccak256(defaultAbiCoder.encode(["uint256"], [hashSeed]));
    
        // Buy tickets
        const lotteryNo = 1;
        await companyLotteries.connect(user).buyTicketTx(lotteryNo, quantity, hashRndNumber);
            // Check contract balance
        const contractBalance = await testToken.balanceOf(companyLotteries.address);
        expect(contractBalance.toString()).to.eq((ticketPrice*quantity).toString());
    });    
    
});

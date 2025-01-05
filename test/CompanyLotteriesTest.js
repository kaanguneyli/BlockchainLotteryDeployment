const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("AdminFacet", function () {
    let companyLotteries, testToken;
    let owner, user;

    beforeEach(async () => {
        [owner, user] = await ethers.getSigners();
    
        // Deploy TestToken contract
        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy();
    
        // Ensure TestToken is deployed successfully
        console.log("TestToken deployed to:", testToken.address);
    
        // Deploy AdminFacet contract with required arguments
        const AdminFacet = await ethers.getContractFactory("AdminFacet");
        companyLotteries = await AdminFacet.deploy();
    
        // Ensure AdminFacet is deployed successfully
        console.log("AdminFacet deployed to:", companyLotteries.address);
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
        const lotteryNo = await companyLotteries.getLotteryCount();
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

});

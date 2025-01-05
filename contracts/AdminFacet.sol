// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibLotteryStorage.sol";
import "./diamond/contracts/libraries/LibDiamond.sol";


contract AdminFacet {
    event LotteryCreated(uint indexed lottery_no);
    // event PaymentTokenSet(address indexed tokenAddress);
    // event ProceedsWithdrawn(uint indexed lottery_no, uint amount);

    function createLottery(
        uint unixEnd,
        uint nooftickets,
        uint noofwinners,
        uint minpercentage,
        uint ticketprice,
        bytes32 htmlhash,
        string memory url
    ) external {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(unixEnd > block.timestamp, "End time must be in the future");
        require(minpercentage >= 0 && minpercentage <= 100, "Invalid percentage");

        uint lotteryNo = ++ls.lotteryCount;
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lotteryNo];

        lottery.details.startTime = block.timestamp;
        lottery.details.unixEnd = unixEnd;
        lottery.details.totalTickets = nooftickets;
        lottery.details.winnersCount = noofwinners;
        lottery.details.minpercentage = minpercentage;
        lottery.details.ticketprice = ticketprice;
        lottery.details.htmlhash = htmlhash;
        lottery.details.url = url;

        lottery.status.isCancelled = true;
        lottery.status.ticketsSold = 0;             // gpt yazmamıştı
        lottery.status.cumulativeRandomness = 0;    // gpt yazmamıştı

        emit LotteryCreated(lotteryNo);
    }

    /**
     * @dev Sets the payment token for the lottery system.
     * Only callable by the contract owner.
     */
    function setPaymentToken(address ercTokenAddr) external {
        LibDiamond.enforceIsContractOwner(); // Ensure only the owner can call this function
        require(ercTokenAddr != address(0), "Invalid token address");

        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        ls.paymentToken = IERC20(ercTokenAddr);

        // emit PaymentTokenSet(ercTokenAddr);
    }

    /**
     * @dev Withdraws proceeds from a completed lottery.
     * Only callable by the contract owner.
     */
    function withdrawTicketProceeds(uint lottery_no) external {
        LibDiamond.enforceIsContractOwner(); // Ensure only the owner can call this function

        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery was cancelled");

        uint proceeds = lottery.status.ticketsSold * lottery.details.ticketprice;
        require(ls.paymentToken.transfer(msg.sender, proceeds), "Withdrawal failed");

        // emit ProceedsWithdrawn(lottery_no, proceeds);
    }

    function getLotteryCount() public view returns (uint) {
    LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
    return ls.lotteryCount;
}


}

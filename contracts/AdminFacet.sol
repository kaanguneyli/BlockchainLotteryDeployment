// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibLotteryStorage.sol";
import "./diamond/contracts/libraries/LibDiamond.sol";


contract AdminFacet {
    event PaymentTokenSet(address indexed tokenAddress);
    event ProceedsWithdrawn(uint indexed lottery_no, uint amount);

    /**
     * @dev Sets the payment token for the lottery system.
     * Only callable by the contract owner.
     */
    function setPaymentToken(address ercTokenAddr) external {
        LibDiamond.enforceIsContractOwner(); // Ensure only the owner can call this function
        require(ercTokenAddr != address(0), "Invalid token address");

        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        ls.paymentToken = IERC20(ercTokenAddr);

        emit PaymentTokenSet(ercTokenAddr);
    }

    /**
     * @dev Withdraws proceeds from a completed lottery.
     * Only callable by the contract owner.
     */
    function withdrawProceeds(uint lottery_no) external {
        LibDiamond.enforceIsContractOwner(); // Ensure only the owner can call this function

        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery was cancelled");

        uint proceeds = lottery.status.ticketsSold * lottery.details.ticketprice;
        require(ls.paymentToken.transfer(msg.sender, proceeds), "Withdrawal failed");

        emit ProceedsWithdrawn(lottery_no, proceeds);
    }

    /**
     * @dev Returns the current payment token address.
     */
    function getPaymentToken() external view returns (address) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        return address(ls.paymentToken);
    }
}

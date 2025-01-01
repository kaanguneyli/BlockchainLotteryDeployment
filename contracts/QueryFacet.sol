// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibLotteryStorage.sol";

contract QueryFacet {
    function getNumPurchaseTxs(uint lottery_no) public view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");
        return ls.lotteries[lottery_no].status.purchases.length;
    }

    function getIthPurchasedTicketTx(uint i, uint lottery_no) public view returns (uint sticketno, uint quantity) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");
        require(i > 0 && i - 1 < ls.lotteries[lottery_no].status.purchases.length, "Invalid ticket index");

        LibLotteryStorage.Purchase storage purchase = ls.lotteries[lottery_no].status.purchases[i - 1];
        return (purchase.sticketno, purchase.quantity);
    }

    function getIthWinningTicket(uint lottery_no, uint i) public view returns (uint ticketNo) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery cancelled");
        require(i < lottery.status.winners.length, "Invalid winner index");

        return lottery.status.winners[i].ticket_no;
    }

    function getLotterySales(uint lottery_no) public view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        return ls.lotteries[lottery_no].status.ticketsSold;
    }

    function getStartTime(uint lottery_no) external view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        return ls.lotteries[lottery_no].details.startTime;
    }

    function getPaymentToken() external view returns (address) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        return address(ls.paymentToken);
    }

    function getLotteryInfo(uint lottery_no) public view returns (uint, uint, uint, uint, uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        return (
            lottery.details.startTime,
            lottery.details.totalTickets,
            lottery.details.winnersCount,
            lottery.details.minpercentage,
            lottery.details.ticketprice
        );
    }

    function getLotteryURL(uint lottery_no) public view returns (bytes32, string memory) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        return (lottery.details.htmlhash, lottery.details.url);
    }
}
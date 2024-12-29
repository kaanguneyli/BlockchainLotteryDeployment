// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibLotteryStorage.sol";

contract LotteryFacet {
    event LotteryCreated(uint indexed lottery_no);
    event TicketPurchased(uint indexed lottery_no, uint sticketno, address indexed buyer, uint quantity);

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

        emit LotteryCreated(lotteryNo);
    }

    function buyTicketTx(uint lottery_no, uint quantity, bytes32 hash_rnd_number) external {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(lottery.status.ticketsSold + quantity <= lottery.details.totalTickets, "Exceeds limit");
        require(quantity > 0 && quantity <= 30, "Purchase up to 30 tickets only");

        uint totalCost = lottery.details.ticketprice * quantity;
        require(ls.paymentToken.transferFrom(msg.sender, address(this), totalCost), "Payment failed");

        for (uint i = 0; i < quantity; i++) {
            lottery.status.tickets.push(LibLotteryStorage.Ticket({
                buyer: msg.sender,
                ticket_no: lottery.status.ticketsSold + i,
                hashedrnd_number: hash_rnd_number,
                isRefunded: false,
                quantity: quantity,
                isRevealed: false
            }));
        }

        lottery.status.ticketsSold += quantity;
        emit TicketPurchased(lottery_no, lottery.status.ticketsSold, msg.sender, quantity);
    }

    function revealRndNumberTx(uint lottery_no, uint sticketno, uint quantity, uint rnd_number) external {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp >= (lottery.details.unixEnd - lottery.details.startTime) / 2 + lottery.details.startTime, "Reveal period not started");
        require(block.timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(!lottery.status.tickets[sticketno].isRevealed, "Ticket already revealed");
        require(lottery.status.ticketsSold * 100 / lottery.details.totalTickets >= lottery.details.minpercentage, "Lottery cancelled");

        LibLotteryStorage.Ticket storage ticket = lottery.status.tickets[sticketno];
        require(ticket.buyer == msg.sender, "Not ticket owner");
        require(ticket.quantity == quantity, "Wrong quantity");
        require(ticket.hashedrnd_number == keccak256(abi.encodePacked(msg.sender, rnd_number)), "Invalid random number");

        for (uint i = 0; i < quantity; i++) {
            ticket = lottery.status.tickets[sticketno + i];
            lottery.status.revealedTickets.push(ticket);
            ticket.isRevealed = true;
        }

        lottery.status.cumulativeRandomness ^= rnd_number;

        if (lottery.status.revealedTickets.length >= lottery.details.minpercentage * lottery.details.totalTickets / 100) {
            lottery.status.isCancelled = false;
        }
    }
}

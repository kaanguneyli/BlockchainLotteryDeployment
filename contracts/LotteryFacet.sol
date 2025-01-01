// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/LibLotteryStorage.sol";

contract LotteryFacet {
    event TicketPurchased(uint indexed lottery_no, uint sticketno, address indexed buyer, uint quantity);
    event WinnersAnnounced(uint indexed lottery_no, uint winningTicket);
    event WinningsClaimed(uint indexed lottery_no, address indexed winner, uint amount);

    function buyTicketTx(uint lottery_no, uint quantity, bytes32 hash_rnd_number) external {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");     // gpt yazmamıştı
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(lottery.status.ticketsSold + quantity <= lottery.details.totalTickets, "Exceeds limit");
        require(quantity > 0 && quantity <= 30, "Purchase up to 30 tickets only");
        require(block.timestamp < (lottery.details.unixEnd - lottery.details.startTime) / 2 + lottery.details.startTime, "Reveal period started");    // gpt yazmamıştı

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

        // gpt yazmamıştı
        lottery.status.purchases.push(LibLotteryStorage.Purchase({
            sticketno: lottery.status.ticketsSold,
            quantity: quantity,
            buyer: msg.sender
        }));

        lottery.status.ticketsSold += quantity;
        emit TicketPurchased(lottery_no, lottery.status.ticketsSold, msg.sender, quantity);
    }

    function revealRndNumberTx(uint lottery_no, uint sticketno, uint quantity, uint rnd_number) external {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");     // gpt yazmamıştı

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
       
    function determineWinner(uint lottery_no) internal {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(!lottery.status.isCancelled, "Lottery cancelled");
        require(lottery_no <= ls.lotteryCount, "Invalid lottery number");
        require(lottery.status.revealedTickets.length > 0, "No revealed tickets");

        uint cumulativeRandom = lottery.status.cumulativeRandomness;
        uint winnersFound = 0;

        // Clear previous winners
        delete lottery.status.winners;

        uint totalNum = lottery.status.revealedTickets.length;

        for (uint i = 0; i < lottery.details.winnersCount; ) {
            uint randomIndex = cumulativeRandom % totalNum;
            LibLotteryStorage.Ticket storage winningTicket = lottery.status.revealedTickets[randomIndex];

            // Ensure the ticket has not already been chosen as a winner
            bool alreadyWinner = false;
            for (uint j = 0; j < lottery.status.winners.length; j++) {
                if (lottery.status.winners[j].ticket_no == winningTicket.ticket_no) {
                    alreadyWinner = true;
                    break;
                }
            }

            if (!alreadyWinner) {
                lottery.status.winners.push(winningTicket);
                winnersFound++;
                i++;
            }

            // Update randomness for the next selection
            cumulativeRandom ^= uint(keccak256(abi.encodePacked(cumulativeRandom, i)));

            // Break if all winners are selected
            if (winnersFound >= lottery.details.winnersCount) {
                break;
            }
        }

        // Emit events for the winners
        for (uint i = 0; i < lottery.status.winners.length; i++) {
            emit WinnersAnnounced(lottery_no, lottery.status.winners[i].ticket_no);
        }
    }

    function checkIfMyTicketWon(uint lottery_no, uint ticketNo) public view returns (bool) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery cancelled");

        for (uint i = 0; i < lottery.status.winners.length; i++) {
            if (lottery.status.winners[i].ticket_no == ticketNo && lottery.status.winners[i].buyer == msg.sender) {
                return true;
            }
        }
        return false;
    }

    function checkIfAddrTicketWon(address addr, uint lottery_no, uint ticketNo) public view returns (bool) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        require(ticketNo >= 0 && ticketNo < lottery.details.totalTickets, "Invalid ticket number");
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery cancelled");

        for (uint i = 0; i < lottery.status.winners.length; i++) {
            if (lottery.status.winners[i].ticket_no == ticketNo && lottery.status.winners[i].buyer == addr) {
                return true;
            }
        }
        return false;
    }
    
    function withdrawTicketRefund(uint lottery_no, uint sticket_no) public {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        require(lottery.status.isCancelled, "Lottery not cancelled");
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(sticket_no < lottery.status.tickets.length, "Invalid ticket number");

        LibLotteryStorage.Ticket storage ticket = lottery.status.tickets[sticket_no];
        require(ticket.buyer == msg.sender, "Not ticket owner");

        for (uint i = 0; i < ticket.quantity; i++) {
            ticket = lottery.status.tickets[sticket_no + i];
            require(!ticket.isRefunded, "Ticket already refunded");
            ticket.isRefunded = true;
        }

        uint refundAmount = ticket.quantity * lottery.details.ticketprice;
        require(lottery.details.paymentToken.transfer(msg.sender, refundAmount), "Refund failed");
    }
}

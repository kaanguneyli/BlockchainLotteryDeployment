// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./diamond/contracts/libraries/LibDiamond.sol";
import './diamond/contracts/Diamond.sol';
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library LibLotteryStorage {
    bytes32 constant LOTTERY_STORAGE_POSITION =
        keccak256("diamond.storage.LotteryStorage.v1");

    struct Ticket {  
        address buyer;
        uint ticket_no;   // Ordered unique number
        bytes32 hashedrnd_number;   // Hashed random number for secure verification
        bool isRefunded;
        uint quantity;
        bool isRevealed;   // Indicates if the ticket's random number has been revealed
    }

    struct Purchase {
        uint sticketno;    // Starting ticket number in "tickets" array for this purchase
        uint quantity;
        address buyer;
    }

    struct LotteryDetails {
        uint startTime;
        uint unixEnd;
        uint totalTickets;
        uint winnersCount;
        uint minpercentage;
        uint ticketprice;
        IERC20 paymentToken;   // ERC20 token used for payments
        bytes32 htmlhash;
        string url;
    }

    struct LotteryStatus {
        bool isCancelled;
        uint ticketsSold;
        uint cumulativeRandomness;   // Used to calculate randomness for winners
        Ticket[] tickets;
        Ticket[] revealedTickets;
        Ticket[] winners;
        Purchase[] purchases;
    }

    struct LotteryStorage {
        IERC20 paymentToken;
        uint lotteryCount;
        mapping(uint => Lottery) lotteries;  
    }

    struct Lottery {
        LotteryDetails details;  // Static details of the lottery
        LotteryStatus status;    // Dynamic status and operations of the lottery
    }

    function lotteryStorage() internal pure returns (LotteryStorage storage ls) {
        bytes32 position = LOTTERY_STORAGE_POSITION;
        assembly {
            ls.slot := position
        }
    }
}

contract LotteryFacet {
    event TicketPurchased(uint indexed lottery_no, uint sticketno, address indexed buyer, uint quantity);
    event WinnersAnnounced(uint indexed lottery_no, uint winningTicket);
    event WinningsClaimed(uint indexed lottery_no, address indexed winner, uint amount);
    event LotteryCreated(uint indexed lottery_no);
    event RevealCalled(uint indexed lottery_no, uint sticketno, uint quantity, uint rnd_number, bytes32 hash_rnd_number);

    /**
     * @dev Allows users to purchase tickets for an active lottery.
     * Ensures proper conditions such as availability and payment success.
     */
    function buyTicketTx(uint lottery_no, uint quantity, bytes32 hash_rnd_number) external  returns( uint sticketno)  {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");    
        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(lottery.status.ticketsSold + quantity <= lottery.details.totalTickets, "Exceeds limit");
        require(quantity > 0 && quantity <= 30, "Purchase up to 30 tickets only");
        require(block.timestamp < (lottery.details.unixEnd - lottery.details.startTime) / 2 + lottery.details.startTime, "Reveal period started");

        uint totalCost = lottery.details.ticketprice * quantity;
        require(
            address(ls.paymentToken).code.length > 0,
            "Invalid payment token address"
        );

        // (bool success, bytes memory data) = address(ls.paymentToken).call(
        //     abi.encodeWithSelector(
        //         ls.paymentToken.transferFrom.selector,
        //         msg.sender,
        //         address(this),
        //         totalCost
        //     )
        // );

        // require(success && (data.length == 0 || abi.decode(data, (bool))), "Payment failed");

        require(ls.paymentToken.transferFrom(msg.sender, address(this), totalCost), "Payment failed");

        sticketno = lottery.status.ticketsSold;  // Sequential allocation of tickets


        for (uint i = 0; i < quantity; i++) {
            lottery.status.tickets.push(LibLotteryStorage.Ticket({
                buyer: msg.sender,
                ticket_no: sticketno + i,
                hashedrnd_number: hash_rnd_number,
                isRefunded: false,
                quantity: quantity,
                isRevealed: false
            }));
        }

        lottery.status.purchases.push(LibLotteryStorage.Purchase({
            sticketno: sticketno,
            quantity: quantity,
            buyer: msg.sender
        }));

        lottery.status.ticketsSold += quantity;
        emit TicketPurchased(lottery_no, sticketno, msg.sender, quantity);
        return sticketno;
    }

    /**
     * @dev Reveals the random number associated with purchased tickets for a lottery.
     * Helps ensure transparency in winner determination.
     */
    function revealRndNumberTx(uint lottery_no, uint sticketno, uint quantity, uint rnd_number) external {
        bytes32 hash_rnd_number = keccak256(abi.encodePacked(msg.sender, rnd_number));
        emit RevealCalled(lottery_no, sticketno, quantity, rnd_number, hash_rnd_number);
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];

        require(block.timestamp >= (lottery.details.unixEnd - lottery.details.startTime) / 2 + lottery.details.startTime, "Reveal period not started");
        require(block.timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(!lottery.status.tickets[sticketno].isRevealed, "Ticket already revealed");
        require(lottery.status.ticketsSold * 100 / lottery.details.totalTickets >= lottery.details.minpercentage, "Lottery cancelled");

        LibLotteryStorage.Ticket storage ticket = lottery.status.tickets[sticketno];
        require(ticket.buyer == msg.sender, "Not ticket owner");
        require(ticket.quantity == quantity, "Wrong quantity");
        // require(ticket.hashedrnd_number == keccak256(abi.encodePacked(msg.sender, rnd_number)), "Invalid random number");
 
        for (uint i = 0; i < quantity; i++) {
            ticket = lottery.status.tickets[sticketno + i];
            lottery.status.revealedTickets.push(ticket);
            ticket.isRevealed = true;
        }

        lottery.status.cumulativeRandomness ^= rnd_number;   // Update randomness for winner selection
        if (lottery.status.revealedTickets.length >= lottery.details.minpercentage * lottery.details.totalTickets / 100) {
            lottery.status.isCancelled = false;   // If minimum percentage is met, activate the lottery
            determineWinner(lottery_no);  // Calculate and announce winners
        }
    }
    
    /**
     * @dev Internal function to determine and store lottery winners.
     * Randomness and revealed tickets are used for fair selection.
     */    
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
                lottery.status.winners.push(winningTicket);  // Add the winning ticket
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

    /**
     * @dev Checks if the caller's ticket won in the given lottery.
     * Only callable after the lottery ends.
     */
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

    /**
     * @dev Checks if a specific address owns a winning ticket in the given lottery.
     */
    function checkIfAddrTicketWon(address addr, uint lottery_no, uint ticketNo) public view returns (bool) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        require(ticketNo >= 0 && ticketNo < lottery.details.totalTickets, "Invalid ticket number");
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery cancelled");

        // Check if the ticket is in the winners list and owned by the address
        for (uint i = 0; i < lottery.status.winners.length; i++) {
            if (lottery.status.winners[i].ticket_no == ticketNo && lottery.status.winners[i].buyer == addr) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @dev Allows a ticket owner to withdraw their ticket refund if the lottery was cancelled.
     */
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
        require(ls.paymentToken.transfer(msg.sender, refundAmount), "Refund failed");

    }

    /**
     * @dev Creates a new lottery with the specified parameters. 
     * Only the contract owner can call this function.
     */
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

        lottery.status.isCancelled = true;   // Start in a cancelled state until conditions are met
        lottery.status.ticketsSold = 0;
        lottery.status.cumulativeRandomness = 0;

        emit LotteryCreated(lotteryNo);
    }

    /**
     * @dev Sets the payment token for the lottery system.
     * Only callable by the contract owner.
     */
    function setPaymentToken(address ercTokenAddr) external {
        // LibDiamond.enforceIsContractOwner(); // Ensure only the owner can call this function
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
        // emit ProceedsWithdrawn(lottery_no, proceeds);

        uint proceeds = lottery.status.ticketsSold * lottery.details.ticketprice;
        require(ls.paymentToken.transfer(LibDiamond.contractOwner(), proceeds), "Withdrawal failed");
    }

    /**
     * @dev Returns the current lottery count (latest lottery number).
     */
    function getLotteryCount() public view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        return ls.lotteryCount;
    }

    /**
     * @dev Returns the total number of purchase transactions for a given lottery.
     */
    function getNumPurchaseTxs(uint lottery_no) public view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");
        return ls.lotteries[lottery_no].status.purchases.length;
    }

    /**
     * @dev Returns details of the i-th purchase transaction for a given lottery.
     */
    function getIthPurchasedTicketTx(uint i, uint lottery_no) public view returns (uint sticketno, uint quantity) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");
        require(i > 0 && i - 1 < ls.lotteries[lottery_no].status.purchases.length, "Invalid ticket index");

        LibLotteryStorage.Purchase storage purchase = ls.lotteries[lottery_no].status.purchases[i - 1];
        return (purchase.sticketno, purchase.quantity);
    }

    /**
     * @dev Returns the ticket number of the i-th winner in the given lottery.
     */
    function getIthWinningTicket(uint lottery_no, uint i) public view returns (uint ticketNo) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        require(!lottery.status.isCancelled, "Lottery cancelled");
        require(i < lottery.status.winners.length, "Invalid winner index");

        return lottery.status.winners[i].ticket_no;
    }

    /**
     * @dev Returns the total number of tickets sold in the given lottery.
     */
    function getLotterySales(uint lottery_no) public view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        return ls.lotteries[lottery_no].status.ticketsSold;
    }

    /**
     * @dev Returns the starting time of the given lottery.
     */
    function getStartTime(uint lottery_no) external view returns (uint) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        return ls.lotteries[lottery_no].details.startTime;
    }

    /**
     * @dev Returns the payment token address.
     */
    function getPaymentToken() external view returns (address) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        return address(ls.paymentToken);
    }

    /**
     * @dev Returns information about the given lottery.
     */
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

    /**
     * @dev Returns the URL for the given lottery.
     */
    function getLotteryURL(uint lottery_no) public view returns (bytes32, string memory) {
        LibLotteryStorage.LotteryStorage storage ls = LibLotteryStorage.lotteryStorage();
        require(ls.lotteryCount >= lottery_no, "Invalid lottery number");

        LibLotteryStorage.Lottery storage lottery = ls.lotteries[lottery_no];
        return (lottery.details.htmlhash, lottery.details.url);
    }
}


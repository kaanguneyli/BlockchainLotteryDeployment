// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CompanyLotteries is Ownable {

    struct Ticket {
        address buyer;
        uint ticket_no; // Ordered unique number
        bytes32 hashedrnd_number; // Hashed random number for secure verification
        bool isRefunded;
        uint quantity;
        bool isRevealed; // Indicates if the ticket's random number has been revealed
    }
    
    struct Purchase{
        uint sticketno; // Starting ticket number in "tickets" array for this purchase
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
        IERC20 paymentToken; // ERC20 token used for payments
        bytes32 htmlhash;
        string url;
    }

    struct LotteryStatus {
        bool isCancelled;
        uint ticketsSold;
        uint cumulativeRandomness; // Used to calculate randomness for winners
        Ticket[] tickets;
        Ticket[] revealedTickets;
        Ticket[] winners;
        Purchase[] purchases;
    }

    struct Lottery {
        LotteryDetails details; // Static details of the lottery
        LotteryStatus status; // Dynamic status and operations of the lottery
    }
    
    IERC20 public paymentToken;
    uint public lotteryCount;
    mapping(uint => Lottery) public lotteries;

    event LotteryCreated(uint indexed lottery_no);
    event TicketPurchased(uint indexed lottery_no, uint sticketnoNo, address indexed buyer, uint quantity);
    event WinnersAnnounced(uint indexed lottery_no, uint winningTicket);
    event WinningsClaimed(uint indexed lottery_no, address indexed winner, uint amount);

    constructor() Ownable(msg.sender){}

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
    ) public onlyOwner returns (uint lottery_no) {
        require(unixEnd > block.timestamp, "End time must be in the future");
        require(minpercentage >= 0 && minpercentage <= 100, "Minimum percentage must be between 0 and 100");

        lottery_no = ++lotteryCount;
        Lottery storage lottery = lotteries[lottery_no];
        lottery.details.startTime = block.timestamp;
        lottery.details.unixEnd = unixEnd;
        lottery.details.totalTickets = nooftickets;
        lottery.details.winnersCount = noofwinners;
        lottery.details.minpercentage = minpercentage;
        lottery.details.ticketprice = ticketprice;
        lottery.details.paymentToken = paymentToken;
        lottery.details.htmlhash = htmlhash;
        lottery.details.url = url;

        lottery.status.isCancelled = true; // Start in a cancelled state until conditions are met
        lottery.status.ticketsSold = 0;
        lottery.status.cumulativeRandomness = 0;

        emit LotteryCreated(lottery_no);
        return lottery_no;
    }
    
    // Checks the hash match at the reveal stage
    function get_hashedrnd(uint rnd) view public returns (bytes32){
        return keccak256(abi.encodePacked(msg.sender, rnd));
    }

    /**
     * @dev Allows users to purchase tickets for an active lottery.
     * Ensures proper conditions such as availability and payment success.
     */
    function buyTicketTx(uint lottery_no, uint quantity, bytes32 hash_rnd_number) public returns (uint sticketno) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        Lottery storage lottery = lotteries[lottery_no];
        require(block.timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(lottery.status.ticketsSold + quantity <= lottery.details.totalTickets, "Exceeds ticket limit");
        require(quantity > 0 && quantity <= 30, "Purchase up to 30 tickets only");
        require(block.timestamp < (lottery.details.unixEnd - lottery.details.startTime) / 2 + lottery.details.startTime, "Buying period has ended");     


        uint totalCost = lottery.details.ticketprice * quantity;
        require(paymentToken.transferFrom(msg.sender, address(this), totalCost), "Payment failed");

        sticketno = lottery.status.ticketsSold; // Sequential allocation of tickets
        
        for (uint i = 0; i < quantity; i++) {
             lottery.status.tickets.push(Ticket({
                buyer: msg.sender,
                ticket_no: sticketno + i,
                hashedrnd_number: hash_rnd_number,
                isRefunded: false,
                quantity: quantity,
                isRevealed: false
            }));
         }
         
        lottery.status.purchases.push(Purchase({
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
    function revealRndNumberTx(uint lottery_no, uint sticketno, uint quantity, uint rnd_number) public {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        Lottery storage lottery = lotteries[lottery_no];
        uint timestamp = block.timestamp;
        require(timestamp >= (lottery.details.unixEnd - lottery.details.startTime) / 2 + lottery.details.startTime, "Reveal period not started");     
        require(timestamp < lottery.details.unixEnd, "Lottery has ended");
        require(lottery.status.tickets[sticketno].isRevealed == false, "Ticket already revealed");
        require(lottery.status.ticketsSold * 100 / lottery.details.totalTickets >= lottery.details.minpercentage, "Lottery cancelled");
        Ticket storage ticket = lottery.status.tickets[sticketno];
        require(ticket.buyer == msg.sender, "Not ticket owner");
        require(ticket.quantity == quantity, "Wrong quantity");
        require(ticket.hashedrnd_number == keccak256(abi.encodePacked(msg.sender, rnd_number)), "Invalid random number");
        
        for (uint i  = 0; i < quantity; i++){
            ticket = lottery.status.tickets[sticketno + i];
            lottery.status.revealedTickets.push(ticket);
            ticket.isRevealed = true;
        }

        lottery.status.cumulativeRandomness ^= rnd_number; // Update randomness for winner selection
        if (lottery.status.revealedTickets.length >=  lottery.details.minpercentage *lottery.details.totalTickets/100) {
            lottery.status.isCancelled = false; // If minimum percentage is met, activate the lottery
            determineWinner(lottery_no); // Calculate and announce winners

        }
    }

    /**
     * @dev Internal function to determine and store lottery winners.
     * Randomness and revealed tickets are used for fair selection.
     */
    function determineWinner(uint lottery_no) internal {
        require(!lotteries[lottery_no].status.isCancelled, "Lottery cancelled");
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        require(lotteries[lottery_no].status.revealedTickets.length > 0, "No one has revealed their random numbers");

        Lottery storage lottery = lotteries[lottery_no];
        uint cumulativeRandom = lottery.status.cumulativeRandomness;
        uint winnersFound = 0;
        delete lottery.status.winners; // Reset winners
        uint total_num = lottery.status.revealedTickets.length;

        for (uint i = 0; i < lottery.details.winnersCount; ) {
            uint randomIndex = cumulativeRandom % total_num;

            Ticket storage winningTicket = lottery.status.tickets[randomIndex];
            
            bool alreadyWinner = false;
            for (uint j = 0; j < lottery.status.winners.length; j++) {
                if (lottery.status.winners[j].ticket_no == winningTicket.ticket_no) {               
                    alreadyWinner = true;
                    break;
                }
            }
            
            if (!alreadyWinner) {
                lottery.status.winners.push(winningTicket); // Add the winning ticket
                winnersFound++;
                i++;
            }

            // Update randomness to ensure different winners
            cumulativeRandom ^= uint(keccak256(abi.encodePacked(cumulativeRandom, i)));
            
            if (winnersFound >= lottery.details.winnersCount) {
                break;
            }
        }

        for (uint i = 0; i < lottery.status.winners.length; i++) {
            emit WinnersAnnounced(lottery_no, lottery.status.winners[i].ticket_no);
        }
    }

    /**
     * @dev Returns the total number of purchase transactions for a given lottery.
     */
    function getNumPurchaseTxs(uint lottery_no) public view returns (uint numPurchaseTxs) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        return lotteries[lottery_no].status.purchases.length;
    }

    /**
     * @dev Returns details of the i-th purchase transaction for a given lottery.
     */
    function getIthPurchasedTicketTx(uint i, uint lottery_no) public view returns (uint sticketno, uint quantity) {
        require(i > 0 && i-1 < lotteries[lottery_no].status.tickets.length, "Invalid ticket index");
        return (lotteries[lottery_no].status.purchases[i-1].sticketno, lotteries[lottery_no].status.purchases[i-1].quantity);           // todo check if this is index or not
    }

    /**
     * @dev Checks if the caller's ticket won in the given lottery.
     * Only callable after the lottery ends.
     */
    function checkIfMyTicketWon(uint lottery_no, uint ticketNo) public view returns (bool won) {                         // could just a field called isWinner in the ticket struct but ith one would make whole tickets to be checked
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        require(ticketNo >= 0 && ticketNo <= lotteries[lottery_no].details.totalTickets, "Invalid ticket number");
        require(block.timestamp >= lotteries[lottery_no].details.unixEnd, "Lottery not ended");
        Lottery storage lottery = lotteries[lottery_no];
        require(!lottery.status.isCancelled, "Lottery cancelled");

        for (uint i = 0; i < lottery.status.winners.length; i++) {
            Ticket storage winner = lottery.status.winners[i];
            if (ticketNo == winner.ticket_no && winner.buyer == msg.sender) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Checks if a specific address owns a winning ticket in the given lottery.
     */
    function checkIfAddrTicketWon(address addr, uint lottery_no, uint ticketNo) public view  returns (bool won) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        require(ticketNo >= 0 && ticketNo <= lotteries[lottery_no].details.totalTickets, "Invalid ticket number");
        require(block.timestamp >= lotteries[lottery_no].details.unixEnd, "Lottery not ended");
        Lottery storage lottery = lotteries[lottery_no];
        require(!lottery.status.isCancelled, "Lottery cancelled");

        // Check if the ticket is in the winners list and owned by the address
        for (uint i = 0; i < lottery.status.winners.length; i++) {
            Ticket storage winner = lottery.status.winners[i];
            if (ticketNo == winner.ticket_no && winner.buyer == addr) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Returns the ticket number of the i-th winner in the given lottery.
     */
    function getIthWinningTicket(uint lottery_no, uint i) public view returns (uint ticketNo) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        require(block.timestamp >= lotteries[lottery_no].details.unixEnd, "Lottery not ended");
        Lottery storage lottery = lotteries[lottery_no];
        require(!lottery.status.isCancelled, "Lottery cancelled");
        require(i <= lotteries[lottery_no].status.winners.length, "Invalid winner index");

        return lotteries[lottery_no].status.winners[i-1].ticket_no;
    }

    /**
     * @dev Allows a ticket owner to withdraw their ticket refund if the lottery was cancelled.
     */
    function withdrawTicketRefund(uint lottery_no, uint sticket_no) public {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        Lottery storage lottery = lotteries[lottery_no];
        require(lotteries[lottery_no].status.isCancelled, "Lottery not cancelled");
        require(block.timestamp >= lotteries[lottery_no].details.unixEnd, "Lottery not ended");
        require(sticket_no < lottery.status.tickets.length, "Invalid ticket number");
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        Ticket storage ticket = lottery.status.tickets[sticket_no];
        require(ticket.buyer == msg.sender, "Not ticket owner");

        for (uint i = 0; i < ticket.quantity; i++) {
            ticket = lottery.status.tickets[sticket_no + i];
            require(!ticket.isRefunded, "Ticket already refunded");
            ticket.isRefunded = true;
        }
        uint refundAmount = ticket.quantity * lottery.details.ticketprice;
        require(paymentToken.transfer(msg.sender, refundAmount), "Refund failed");
        // ticket.quantity = 0;
    }

    /**
     * @dev Returns the current lottery count (latest lottery number).
     */
    function getCurrentLotteryNo() public view returns (uint lottery_no) {
        return lotteryCount;
    }

    /**
     * @dev Allows the contract owner to withdraw proceeds from a completed lottery.
     */
    function withdrawTicketProceeds(uint lottery_no) public onlyOwner {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        Lottery storage lottery = lotteries[lottery_no];
        require(block.timestamp >= lottery.details.unixEnd, "Lottery not ended");
        // require(!lottery.status.isCancelled, "Cannot withdraw proceeds");
        require(!lottery.status.isCancelled, "Lottery cancelled");

        uint proceeds = lottery.status.ticketsSold * lottery.details.ticketprice;
        require(paymentToken.transfer(owner(), proceeds), "Withdrawal failed");
    }

    // The rest of the functions are simple getters and setters 

    function setPaymentToken(address erctokenaddr) public onlyOwner {
        require(erctokenaddr != address(0), "Invalid token address");
        paymentToken = IERC20(erctokenaddr);
    }

    function getPaymentToken(uint lottery_no) public returns (address erctokenaddr) {
        return address(lotteries[lottery_no].details.paymentToken);
    }

    function getLotteryInfo(uint lottery_no) public returns (uint unixBeg, uint nooftickets, uint noofwinners, uint minpercentage, uint ticketprice) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        Lottery storage lottery = lotteries[lottery_no];
        return (lottery.details.startTime, lottery.details.totalTickets, lottery.details.winnersCount, lottery.details.minpercentage, lottery.details.ticketprice);
    }

    function getLotteryURL(uint lottery_no) public returns (bytes32 htmlhash, string memory url) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        Lottery storage lottery = lotteries[lottery_no];
        return (lottery.details.htmlhash, lottery.details.url);
    }

    function getLotterySales(uint lottery_no) public returns (uint numSold) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        return lotteries[lottery_no].status.ticketsSold;
    }

    function getStartTime(uint lottery_no) external view returns (uint) {
        require(lottery_no <= lotteryCount, "Invalid lottery number");
        return lotteries[lottery_no].details.startTime;
    }
}

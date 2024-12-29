// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

library LibLotteryStorage {
    bytes32 constant LOTTERY_STORAGE_POSITION =
        keccak256("diamond.storage.LotteryStorage.v1");

    struct Ticket {
        address buyer;
        uint ticket_no;
        bytes32 hashedrnd_number;
        bool isRefunded;
        uint quantity;
        bool isRevealed;
    }

    struct Purchase {
        uint sticketno;
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
        IERC20 paymentToken;
        bytes32 htmlhash;
        string url;
    }

    struct LotteryStatus {
        bool isCancelled;
        uint ticketsSold;
        uint cumulativeRandomness;
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
        LotteryDetails details;
        LotteryStatus status;
    }

    function lotteryStorage() internal pure returns (LotteryStorage storage ls) {
        bytes32 position = LOTTERY_STORAGE_POSITION;
        assembly {
            ls.slot := position
        }
    }
}

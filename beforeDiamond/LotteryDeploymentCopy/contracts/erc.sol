// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestToken is ERC20 {
    constructor() ERC20("TestToken", "TT") {
        _mint(msg.sender, 1000000 * 10 ** decimals()); // Mint 1,000,000 tokens
    }
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./erc.sol";

library LibTokenStorage {
    bytes32 constant TOKEN_STORAGE_POSITION = keccak256("diamond.storage.TokenStorage");

    struct TokenStorage {
        TestToken testToken; // Reference to the token contract
    }

    function tokenStorage() internal pure returns (TokenStorage storage ts) {
        bytes32 position = TOKEN_STORAGE_POSITION;
        assembly {
            ts.slot := position
        }
    }
}

contract TokenFacet {
    event TokenMinted(address indexed to, uint256 amount);

    function mintTokens(address to, uint256 amount) external {
        LibTokenStorage.TokenStorage storage ts = LibTokenStorage.tokenStorage();
        require(address(ts.testToken) != address(0), "TestToken not initialized");
        ts.testToken.mint(to, amount);
        emit TokenMinted(to, amount);
    }
    
}

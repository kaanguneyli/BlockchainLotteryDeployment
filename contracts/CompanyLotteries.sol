// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./diamond/contracts/Diamond.sol";
import "./diamond/contracts/interfaces/IDiamondCut.sol";

contract CompanyLotteries is Diamond {
    constructor(
        IDiamond.FacetCut[] memory _diamondCut, // Pass the initial diamond cut array
        DiamondArgs memory _args // Pass the struct containing initialization data
    ) Diamond(_diamondCut, _args) {}
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IProtocolAdapter {
    function deposit(uint256 amount) external;

    function withdraw(uint256 amount)
        external
        returns (uint256 returned);

    function totalAssets()
        external
        view
        returns (uint256);
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function transfer(
        address to,
        uint256 amount
    ) external returns (bool);

    function balanceOf(
        address account
    ) external view returns (uint256);
}

contract InvestmentPool {

    address public owner;
    IERC20 public usdt;

    uint256 public totalDeposits;

    mapping(address => uint256) public deposits;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address usdtAddress) {
        owner = msg.sender;
        usdt = IERC20(usdtAddress);
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");

        usdt.transferFrom(
            msg.sender,
            address(this),
            amount
        );

        deposits[msg.sender] += amount;
        totalDeposits += amount;
    }

    function withdraw(uint256 amount) external {
        require(
            deposits[msg.sender] >= amount,
            "Insufficient balance"
        );

        deposits[msg.sender] -= amount;
        totalDeposits -= amount;

        usdt.transfer(msg.sender, amount);
    }

    function poolBalance() public view returns (uint256) {
        return usdt.balanceOf(address(this));
    }
}
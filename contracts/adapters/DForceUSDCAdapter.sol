// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IProtocolAdapter.sol";

interface IDForceUSDC {
    function mint(
        address recipient,
        uint256 mintAmount
    ) external;

    function redeemUnderlying(
        address from,
        uint256 redeemAmount
    ) external;

    function balanceOf(
        address account
    ) external view returns (uint256);

    function exchangeRateStored()
        external
        view
        returns (uint256);
}

contract DForceUSDCAdapter is IProtocolAdapter {
    using SafeERC20 for IERC20;

    /*
     * BNB Chain
     *
     * USDC:
     * 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d
     *
     * dForce iUSDC:
     * 0xAF9c10b341f55465E8785F0F81DBB52a9Bfe005d
     */

    IERC20 public immutable usdc;

    IDForceUSDC public constant iUSDC =
        IDForceUSDC(
            0xAF9c10b341f55465E8785F0F81DBB52a9Bfe005d
        );

    address public immutable pool;

    uint256 private constant BASE = 1e18;

    modifier onlyPool() {
        require(
            msg.sender == pool,
            "DForceUSDCAdapter: only pool"
        );
        _;
    }

    constructor(
        address poolAddress,
        address usdcAddress
    ) {
        require(
            poolAddress != address(0),
            "DForceUSDCAdapter: zero pool"
        );

        require(
            usdcAddress != address(0),
            "DForceUSDCAdapter: zero USDC"
        );

        pool = poolAddress;
        usdc = IERC20(usdcAddress);

        usdc.approve(
            address(iUSDC),
            type(uint256).max
        );
    }

    function deposit(
        uint256 amount
    )
        external
        override
        onlyPool
    {
        require(
            amount > 0,
            "DForceUSDCAdapter: zero amount"
        );

        uint256 beforeBalance =
            usdc.balanceOf(address(this));

        usdc.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        uint256 received =
            usdc.balanceOf(address(this))
            - beforeBalance;

        require(
            received > 0,
            "DForceUSDCAdapter: no USDC received"
        );

        iUSDC.mint(
            address(this),
            received
        );

        require(
            usdc.balanceOf(address(this)) == 0,
            "DForceUSDCAdapter: idle USDC"
        );
    }

    function withdraw(
        uint256 amount
    )
        external
        override
        onlyPool
        returns (uint256)
    {
        require(
            amount > 0,
            "DForceUSDCAdapter: zero amount"
        );

        uint256 beforeBalance =
            usdc.balanceOf(address(this));

        iUSDC.redeemUnderlying(
            address(this),
            amount
        );

        uint256 received =
            usdc.balanceOf(address(this))
            - beforeBalance;

        require(
            received > 0,
            "DForceUSDCAdapter: no USDC received"
        );

        usdc.safeTransfer(
            pool,
            received
        );

        return received;
    }

    function totalAssets()
        external
        view
        override
        returns (uint256)
    {
        uint256 iBalance =
            iUSDC.balanceOf(address(this));

        uint256 exchangeRate =
            iUSDC.exchangeRateStored();

        uint256 underlying =
            (iBalance * exchangeRate) / BASE;

        return
            underlying
            + usdc.balanceOf(address(this));
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./IProtocolAdapter.sol";

interface IAavePool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

interface IAaveAToken {
    function balanceOf(
        address account
    ) external view returns (uint256);
}

contract AaveAdapter is IProtocolAdapter {
    using SafeERC20 for IERC20;

    /*
     * BNB Chain Aave V3
     */

    address public constant AAVE_POOL =
        0x6807dc923806fE8Fd134338EABCA509979a7e0cB;

    address public constant AAVE_AUSDT =
        0xa9251ca9DE909CB71783723713B21E4233fbf1B1;

    IERC20 public immutable usdt;

    IAavePool public constant aavePool =
        IAavePool(AAVE_POOL);

    IAaveAToken public constant aUSDT =
        IAaveAToken(AAVE_AUSDT);

    address public immutable pool;

    modifier onlyPool() {
        require(
            msg.sender == pool,
            "Only InvestmentPool"
        );
        _;
    }

    constructor(
        address poolAddress,
        address usdtAddress
    ) {
        require(
            poolAddress != address(0),
            "Invalid pool"
        );

        require(
            usdtAddress != address(0),
            "Invalid USDT"
        );

        pool = poolAddress;
        usdt = IERC20(usdtAddress);
    }

    /*
     * ============================================================
     * DEPOSIT
     * ============================================================
     *
     * InvestmentPoolV2
     *        |
     *        | USDT
     *        v
     * AaveAdapter
     *        |
     *        | supply()
     *        v
     * Aave
     */

    function deposit(
        uint256 amount
    )
        external
        override
        onlyPool
    {
        require(
            amount > 0,
            "Invalid amount"
        );

        usdt.safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        usdt.forceApprove(
            AAVE_POOL,
            amount
        );

        aavePool.supply(
            address(usdt),
            amount,
            address(this),
            0
        );
    }

    /*
     * ============================================================
     * WITHDRAW
     * ============================================================
     *
     * amount == type(uint256).max
     *
     * means:
     * withdraw all available underlying.
     *
     * The actual returned amount from Aave is authoritative.
     */

    function withdraw(
    uint256 amount
)
    external
    override
    onlyPool
    returns (uint256 returned)
{
    require(
        amount > 0,
        "Invalid amount"
    );

    uint256 balanceBefore =
        usdt.balanceOf(address(this));

    /*
     * IMPORTANT:
     *
     * MAX is passed directly to Aave.
     *
     * We do NOT:
     * - read aUSDT balance
     * - convert aUSDT to USDT
     * - subtract 1 wei
     *
     * Aave itself handles the complete position.
     */

    uint256 aaveReturned =
        aavePool.withdraw(
            address(usdt),
            amount,
            address(this)
        );

    require(
        aaveReturned > 0,
        "Aave returned zero"
    );

    uint256 balanceAfter =
        usdt.balanceOf(address(this));

    returned =
        balanceAfter -
        balanceBefore;

    require(
        returned > 0,
        "No USDT received"
    );

    /*
     * Send the REAL USDT received from Aave
     * to InvestmentPool.
     */

    usdt.safeTransfer(
        msg.sender,
        returned
    );
}
    /*
     * ============================================================
     * REAL AAVE POSITION
     * ============================================================
     *
     * This is informational.
     *
     * The amount returned by withdraw() is authoritative because
     * Aave's liquidity index can update during the transaction.
     */

    function totalAssets()
        external
        view
        override
        returns (uint256)
    {
        return aUSDT.balanceOf(
            address(this)
        );
    }
}
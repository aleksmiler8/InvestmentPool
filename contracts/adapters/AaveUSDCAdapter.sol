// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IAaveV3PoolUSDC {
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

interface IAaveUSDCAToken {
    function balanceOf(address account)
        external
        view
        returns (uint256);
}

contract AaveUSDCAdapter {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IAaveV3PoolUSDC public immutable aavePool;
    IAaveUSDCAToken public immutable aUSDC;
    address public immutable pool;

    error OnlyPool();
    error InvalidAddress();

    modifier onlyPool() {
        if (msg.sender != pool) revert OnlyPool();
        _;
    }

    constructor(
        address _usdc,
        address _aavePool,
        address _aUSDC,
        address _pool
    ) {
        if (
            _usdc == address(0) ||
            _aavePool == address(0) ||
            _aUSDC == address(0) ||
            _pool == address(0)
        ) {
            revert InvalidAddress();
        }

        usdc = IERC20(_usdc);
        aavePool = IAaveV3PoolUSDC(_aavePool);
        aUSDC = IAaveUSDCAToken(_aUSDC);
        pool = _pool;
    }

    /**
     * @notice Supply USDC to Aave V3.
     * @dev Called only by InvestmentPool.
     */
    function deposit(uint256 amount)
        external
        onlyPool
        returns (uint256)
    {
        usdc.forceApprove(address(aavePool), amount);

        aavePool.supply(
            address(usdc),
            amount,
            address(this),
            0
        );

        return amount;
    }

    /**
     * @notice Withdraw USDC from Aave V3.
     * @dev Called only by InvestmentPool.
     */
    function withdraw(uint256 amount)
        external
        onlyPool
        returns (uint256)
    {
        uint256 withdrawn = aavePool.withdraw(
            address(usdc),
            amount,
            address(this)
        );

        usdc.safeTransfer(pool, withdrawn);

        return withdrawn;
    }

    /**
     * @notice Current USDC supplied to Aave.
     */
    function balanceUnderlying()
        external
        view
        returns (uint256)
    {
        return aUSDC.balanceOf(address(this));
    }

    /**
     * @notice Current aUSDC balance.
     */
    function balanceOfAToken()
        external
        view
        returns (uint256)
    {
        return aUSDC.balanceOf(address(this));
    }

    /**
     * @notice Token addresses used by this adapter.
     */
    function getTokens()
        external
        view
        returns (
            address underlying,
            address aToken,
            address aavePoolAddress,
            address poolAddress
        )
    {
        return (
            address(usdc),
            address(aUSDC),
            address(aavePool),
            pool
        );
    }
}
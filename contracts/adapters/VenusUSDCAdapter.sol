// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IVenusUSDC {
    function mint(uint256 mintAmount) external returns (uint256);

    function redeemUnderlying(uint256 redeemAmount)
        external
        returns (uint256);

    function balanceOfUnderlying(address owner)
        external
        returns (uint256);

    function balanceOf(address owner)
        external
        view
        returns (uint256);

    function exchangeRateStored()
        external
        view
        returns (uint256);
}

contract VenusUSDCAdapter {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    IVenusUSDC public immutable vUSDC;
    address public immutable pool;

    error OnlyPool();
    error VenusMintFailed(uint256 errorCode);
    error VenusRedeemFailed(uint256 errorCode);
    error InvalidAddress();

    modifier onlyPool() {
        if (msg.sender != pool) revert OnlyPool();
        _;
    }

    constructor(
        address _usdc,
        address _vUSDC,
        address _pool
    ) {
        if (
            _usdc == address(0) ||
            _vUSDC == address(0) ||
            _pool == address(0)
        ) {
            revert InvalidAddress();
        }

        usdc = IERC20(_usdc);
        vUSDC = IVenusUSDC(_vUSDC);
        pool = _pool;
    }

    /**
     * @notice Invest USDC into Venus.
     * @dev Called only by InvestmentPool.
     */
    function deposit(uint256 amount)
        external
        onlyPool
        returns (uint256)
    {
        usdc.forceApprove(address(vUSDC), amount);

        uint256 errorCode = vUSDC.mint(amount);

        if (errorCode != 0) {
            revert VenusMintFailed(errorCode);
        }

        return amount;
    }

    /**
     * @notice Withdraw USDC from Venus.
     * @dev Called only by InvestmentPool.
     */
    function withdraw(uint256 amount)
        external
        onlyPool
        returns (uint256)
    {
        uint256 errorCode = vUSDC.redeemUnderlying(amount);

        if (errorCode != 0) {
            revert VenusRedeemFailed(errorCode);
        }

        usdc.safeTransfer(pool, amount);

        return amount;
    }

    /**
     * @notice Current USDC value supplied to Venus.
     */
    function balanceUnderlying()
        external
        returns (uint256)
    {
        return vUSDC.balanceOfUnderlying(address(this));
    }

    /**
     * @notice Current vUSDC balance held by this adapter.
     */
    function balanceOfVToken()
        external
        view
        returns (uint256)
    {
        return vUSDC.balanceOf(address(this));
    }

    /**
     * @notice Stored Venus exchange rate.
     */
    function exchangeRateStored()
        external
        view
        returns (uint256)
    {
        return vUSDC.exchangeRateStored();
    }

    /**
     * @notice Token addresses used by this adapter.
     */
    function getTokens()
        external
        view
        returns (
            address underlying,
            address vToken,
            address poolAddress
        )
    {
        return (
            address(usdc),
            address(vUSDC),
            pool
        );
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./IProtocolAdapter.sol";

library UniFullMath {
    function mulDiv(uint256 a, uint256 b, uint256 denominator) internal pure returns (uint256 result) {
        unchecked {
            uint256 prod0;
            uint256 prod1;
            assembly {
                let mm := mulmod(a, b, not(0))
                prod0 := mul(a, b)
                prod1 := sub(sub(mm, prod0), lt(mm, prod0))
            }
            if (prod1 == 0) return prod0 / denominator;
            require(denominator > prod1, "FULLMATH_OVERFLOW");
            uint256 remainder;
            assembly {
                remainder := mulmod(a, b, denominator)
                prod1 := sub(prod1, gt(remainder, prod0))
                prod0 := sub(prod0, remainder)
            }
            uint256 twos = denominator & (~denominator + 1);
            assembly {
                denominator := div(denominator, twos)
                prod0 := div(prod0, twos)
                twos := add(div(sub(0, twos), twos), 1)
            }
            prod0 |= prod1 * twos;
            uint256 inverse = (3 * denominator) ^ 2;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            inverse *= 2 - denominator * inverse;
            result = prod0 * inverse;
        }
    }
}

library UniTickMath {
    int24 internal constant MAX_TICK = 887272;

    function getSqrtRatioAtTick(int24 tick) internal pure returns (uint160 sqrtPriceX96) {
        uint256 absTick = tick < 0 ? uint256(-int256(tick)) : uint256(int256(tick));
        require(absTick <= uint256(uint24(MAX_TICK)), "TICK");

        uint256 ratio = absTick & 0x1 != 0
            ? 0xfffcb933bd6fad37aa2d162d1a594001
            : 0x100000000000000000000000000000000;

        if (absTick & 0x2 != 0) ratio = (ratio * 0xfff97272373d413259a46990580e213a) >> 128;
        if (absTick & 0x4 != 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdcc) >> 128;
        if (absTick & 0x8 != 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0) >> 128;
        if (absTick & 0x10 != 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644) >> 128;
        if (absTick & 0x20 != 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0) >> 128;
        if (absTick & 0x40 != 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861) >> 128;
        if (absTick & 0x80 != 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053) >> 128;
        if (absTick & 0x100 != 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4) >> 128;
        if (absTick & 0x200 != 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54) >> 128;
        if (absTick & 0x400 != 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3) >> 128;
        if (absTick & 0x800 != 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9) >> 128;
        if (absTick & 0x1000 != 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825) >> 128;
        if (absTick & 0x2000 != 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5) >> 128;
        if (absTick & 0x4000 != 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7) >> 128;
        if (absTick & 0x8000 != 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6) >> 128;
        if (absTick & 0x10000 != 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9) >> 128;
        if (absTick & 0x20000 != 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604) >> 128;
        if (absTick & 0x40000 != 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98) >> 128;
        if (absTick & 0x80000 != 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2) >> 128;

        if (tick > 0) ratio = type(uint256).max / ratio;
        sqrtPriceX96 = uint160((ratio >> 32) + (ratio % (1 << 32) == 0 ? 0 : 1));
    }
}

interface ISwapRouter02 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external returns (uint256 amountOut);
}

interface IQuoterV2 {
    struct QuoteExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint24 fee;
        uint160 sqrtPriceLimitX96;
    }
    function quoteExactInputSingle(QuoteExactInputSingleParams calldata params)
        external returns (uint256 amountOut, uint160, uint32, uint256);
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }
    function mint(MintParams calldata params) external returns (uint256, uint128, uint256, uint256);
    function increaseLiquidity(IncreaseLiquidityParams calldata params) external returns (uint128, uint256, uint256);
    function decreaseLiquidity(DecreaseLiquidityParams calldata params) external returns (uint256, uint256);
    function collect(CollectParams calldata params) external returns (uint256, uint256);
    function positions(uint256 tokenId) external view returns (
        uint96, address, address, address, uint24, int24, int24, uint128,
        uint256, uint256, uint128, uint128
    );
}

interface IUniswapV3Pool {
    function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool);
}

contract UniswapV3ETHUSDTAdapter is IProtocolAdapter {
    using SafeERC20 for IERC20;

    address public constant WETH = 0x2170Ed0880ac9A755fd29B2688956BD959F933F8;
    address public constant USDT = 0x55d398326f99059fF775485246999027B3197955;
    address public constant UNISWAP_V3_POOL = 0xF9878A5dD55EdC120Fde01893ea713a4f032229c;
    address public constant SWAP_ROUTER = 0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2;
    address public constant POSITION_MANAGER = 0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613;
    address public constant QUOTER = 0x78D78E420Da98ad378D7799bE8f4AF69033EB077;
    uint24 public constant POOL_FEE = 500;
    uint256 private constant BPS = 10_000;
    uint256 private constant SWAP_SLIPPAGE_BPS = 50; // 0.50%

    address public immutable pool;
    IERC20 public immutable usdt;
    uint256 public positionTokenId;
    int24 public tickLower;
    int24 public tickUpper;

    modifier onlyPool() {
        require(msg.sender == pool, "Only InvestmentPool");
        _;
    }

    constructor(address poolAddress) {
        require(poolAddress != address(0), "Invalid pool");
        pool = poolAddress;
        usdt = IERC20(USDT);
    }

    function _positionInfo() internal view returns (uint128 liquidity, int24 lower, int24 upper, uint128 owed0, uint128 owed1) {
        require(positionTokenId != 0, "No position");
        (, , , , , lower, upper, liquidity, , , owed0, owed1) =
            INonfungiblePositionManager(POSITION_MANAGER).positions(positionTokenId);
    }

    function _amountsForLiquidity(
        uint160 sqrtP,
        uint160 sqrtA,
        uint160 sqrtB,
        uint128 liquidity
    ) internal pure returns (uint256 amount0, uint256 amount1) {
        if (sqrtA > sqrtB) (sqrtA, sqrtB) = (sqrtB, sqrtA);
        uint256 L = uint256(liquidity);
        if (sqrtP <= sqrtA) {
            amount0 = UniFullMath.mulDiv(L << 96, uint256(sqrtB) - sqrtA, sqrtB) / sqrtA;
        } else if (sqrtP < sqrtB) {
            amount0 = UniFullMath.mulDiv(L << 96, uint256(sqrtB) - sqrtP, sqrtB) / sqrtP;
            amount1 = UniFullMath.mulDiv(L, uint256(sqrtP) - sqrtA, 1 << 96);
        } else {
            amount1 = UniFullMath.mulDiv(L, uint256(sqrtB) - sqrtA, 1 << 96);
        }
    }

    function _wethToUsdt(uint256 wethAmount, uint160 sqrtP) internal pure returns (uint256) {
        if (wethAmount == 0) return 0;
        uint256 intermediate = UniFullMath.mulDiv(wethAmount, uint256(sqrtP), uint256(1) << 96);
        return UniFullMath.mulDiv(intermediate, uint256(sqrtP), uint256(1) << 96);
    }

    function _positionValueUSDT() internal view returns (uint256 value) {
        if (positionTokenId == 0) return 0;
        (uint128 liquidity, int24 lower, int24 upper, uint128 owed0, uint128 owed1) = _positionInfo();
        (uint160 sqrtP, , , , , , ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();
        uint256 amount0;
        uint256 amount1;
        if (liquidity > 0) {
            (amount0, amount1) = _amountsForLiquidity(
                sqrtP,
                UniTickMath.getSqrtRatioAtTick(lower),
                UniTickMath.getSqrtRatioAtTick(upper),
                liquidity
            );
        }
        amount0 += owed0;
        amount1 += owed1;
        value = amount1 + _wethToUsdt(amount0, sqrtP);
    }

    function deposit(uint256 amount) external override onlyPool {
        require(amount > 0, "Invalid amount");
        uint256 usdtBefore = usdt.balanceOf(address(this));
        usdt.safeTransferFrom(msg.sender, address(this), amount);
        require(usdt.balanceOf(address(this)) - usdtBefore == amount, "USDT transfer mismatch");

        uint256 swapAmount = amount / 2;
        if (swapAmount > 0) {
            (uint256 quoted, , , ) = IQuoterV2(QUOTER).quoteExactInputSingle(
                IQuoterV2.QuoteExactInputSingleParams({
                    tokenIn: USDT,
                    tokenOut: WETH,
                    amountIn: swapAmount,
                    fee: POOL_FEE,
                    sqrtPriceLimitX96: 0
                })
            );
            usdt.forceApprove(SWAP_ROUTER, swapAmount);
            ISwapRouter02(SWAP_ROUTER).exactInputSingle(
                ISwapRouter02.ExactInputSingleParams({
                    tokenIn: USDT,
                    tokenOut: WETH,
                    fee: POOL_FEE,
                    recipient: address(this),
                    amountIn: swapAmount,
                    amountOutMinimum: (quoted * (BPS - SWAP_SLIPPAGE_BPS)) / BPS,
                    sqrtPriceLimitX96: 0
                })
            );
        }

        uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
        uint256 usdtBalance = usdt.balanceOf(address(this));
        IERC20(WETH).forceApprove(POSITION_MANAGER, wethBalance);
        usdt.forceApprove(POSITION_MANAGER, usdtBalance);

        if (positionTokenId == 0) {
            (, int24 currentTick, , , , , ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();
            int24 aligned = (currentTick / 10) * 10;
            tickLower = aligned - 2000;
            tickUpper = aligned + 2000;
            (uint256 tokenId, , , ) = INonfungiblePositionManager(POSITION_MANAGER).mint(
                INonfungiblePositionManager.MintParams({
                    token0: WETH,
                    token1: USDT,
                    fee: POOL_FEE,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    amount0Desired: wethBalance,
                    amount1Desired: usdtBalance,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: address(this),
                    deadline: block.timestamp
                })
            );
            positionTokenId = tokenId;
        } else {
            INonfungiblePositionManager(POSITION_MANAGER).increaseLiquidity(
                INonfungiblePositionManager.IncreaseLiquidityParams({
                    tokenId: positionTokenId,
                    amount0Desired: wethBalance,
                    amount1Desired: usdtBalance,
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp
                })
            );
        }
    }

    function withdraw(
    uint256 amount
)
    external
    override
    onlyPool
    returns (uint256 returned)
{
    require(amount > 0, "Invalid amount");

    /*
     * IMPORTANT:
     * This adapter is a shared vault around one Uniswap V3 NFT.
     *
     * First collect already-earned fees into the adapter.
     * They remain part of the shared assets and are NOT automatically
     * assigned to the caller.
     */
    if (positionTokenId != 0) {
        INonfungiblePositionManager(POSITION_MANAGER).collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: positionTokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );
    }

    uint256 idleUSDT = usdt.balanceOf(address(this));
    uint256 idleWETH = IERC20(WETH).balanceOf(address(this));

    (
        uint160 sqrtP,
        ,
        ,
        ,
        ,
        ,

    ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();

    uint256 idleWETHValue =
        _wethToUsdt(idleWETH, sqrtP);

    uint256 positionValue =
        _positionValueUSDT();

    /*
     * _positionValueUSDT() includes only the active LP liquidity
     * and any fees that are still owed by the NFT.
     *
     * Fees already collected above are now idle assets.
     */
    uint256 totalValue =
        idleUSDT +
        idleWETHValue +
        positionValue;

    require(totalValue > 0, "No position value");

    /*
     * Never promise more than the adapter actually owns.
     */
    uint256 target =
        amount < totalValue
            ? amount
            : totalValue;

    /*
     * Use existing idle USDT first.
     */
    uint256 fromIdleUSDT =
        idleUSDT < target
            ? idleUSDT
            : target;

    uint256 remaining =
        target - fromIdleUSDT;

    uint256 usdtBefore =
        usdt.balanceOf(address(this));

    uint256 wethBefore =
        IERC20(WETH).balanceOf(address(this));

    /*
     * If USDT idle balance is not enough, use idle WETH first.
     */
    if (remaining > 0 && idleWETH > 0) {
        uint256 wethNeeded =
            remaining >= idleWETHValue
                ? idleWETH
                : UniFullMath.mulDiv(
                    remaining,
                    uint256(1) << 96,
                    uint256(sqrtP)
                );

        if (wethNeeded > idleWETH) {
            wethNeeded = idleWETH;
        }

        if (wethNeeded > 0) {
            (
                uint256 quoted,
                ,
                ,

            ) = IQuoterV2(QUOTER).quoteExactInputSingle(
                IQuoterV2.QuoteExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: USDT,
                    amountIn: wethNeeded,
                    fee: POOL_FEE,
                    sqrtPriceLimitX96: 0
                })
            );

            IERC20(WETH).forceApprove(
                SWAP_ROUTER,
                wethNeeded
            );

            ISwapRouter02(SWAP_ROUTER).exactInputSingle(
                ISwapRouter02.ExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: USDT,
                    fee: POOL_FEE,
                    recipient: address(this),
                    amountIn: wethNeeded,
                    amountOutMinimum:
                        (quoted * (BPS - SWAP_SLIPPAGE_BPS)) / BPS,
                    sqrtPriceLimitX96: 0
                })
            );
        }
    }

    /*
     * Recalculate remaining amount after using idle assets.
     */
    uint256 currentUSDT =
        usdt.balanceOf(address(this));

    uint256 recoveredIdle =
        currentUSDT - usdtBefore;

    /*
     * The USDT that existed before this withdrawal is also available.
     */
    uint256 idleAvailable =
        idleUSDT + recoveredIdle;

    if (idleAvailable >= target) {
        returned = target;
    } else {
        /*
         * We still need liquidity from the LP position.
         */
        uint256 needFromLP =
            target - idleAvailable;

        require(
            positionTokenId != 0,
            "No position"
        );

        (
            uint128 liquidity,
            ,
            ,
            ,

        ) = _positionInfo();

        require(
            liquidity > 0,
            "No liquidity"
        );

        require(
            positionValue > 0,
            "No LP value"
        );

        /*
         * Remove ONLY the LP value actually required.
         *
         * No artificial 1% buffer.
         */
        uint256 liquidityToRemove =
            UniFullMath.mulDiv(
                uint256(liquidity),
                needFromLP,
                positionValue
            );

        if (liquidityToRemove == 0) {
            liquidityToRemove = 1;
        }

        if (liquidityToRemove > liquidity) {
            liquidityToRemove = liquidity;
        }

        INonfungiblePositionManager(
            POSITION_MANAGER
        ).decreaseLiquidity(
            INonfungiblePositionManager
                .DecreaseLiquidityParams({
                    tokenId: positionTokenId,
                    liquidity: uint128(liquidityToRemove),
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp
                })
        );

        /*
         * Collect only after decreasing liquidity.
         *
         * Any fees belonging to the still-existing NFT remain
         * in the shared adapter after this withdrawal.
         */
        INonfungiblePositionManager(
            POSITION_MANAGER
        ).collect(
            INonfungiblePositionManager
                .CollectParams({
                    tokenId: positionTokenId,
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
        );

        if (liquidityToRemove == liquidity) {
            positionTokenId = 0;
            tickLower = 0;
            tickUpper = 0;
        }

        /*
         * Convert WETH recovered from the LP into USDT.
         */
        uint256 wethAfter =
            IERC20(WETH).balanceOf(address(this));

        uint256 wethDelta =
            wethAfter > wethBefore
                ? wethAfter - wethBefore
                : 0;

        if (wethDelta > 0) {
            (
                uint256 quoted,
                ,
                ,

            ) = IQuoterV2(QUOTER).quoteExactInputSingle(
                IQuoterV2.QuoteExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: USDT,
                    amountIn: wethDelta,
                    fee: POOL_FEE,
                    sqrtPriceLimitX96: 0
                })
            );

            IERC20(WETH).forceApprove(
                SWAP_ROUTER,
                wethDelta
            );

            ISwapRouter02(SWAP_ROUTER).exactInputSingle(
                ISwapRouter02.ExactInputSingleParams({
                    tokenIn: WETH,
                    tokenOut: USDT,
                    fee: POOL_FEE,
                    recipient: address(this),
                    amountIn: wethDelta,
                    amountOutMinimum:
                        (quoted * (BPS - SWAP_SLIPPAGE_BPS)) / BPS,
                    sqrtPriceLimitX96: 0
                })
            );
        }

        uint256 finalUSDT =
            usdt.balanceOf(address(this));

        /*
         * The adapter may return only what it really recovered.
         * It NEVER creates USDT to cover a shortfall.
         */
        require(
            finalUSDT >= target,
            "Insufficient recovered USDT"
        );

        returned = target;
    }

    require(
        returned > 0,
        "No USDT recovered"
    );

    usdt.safeTransfer(
        msg.sender,
        returned
    );
}

    function totalAssets() external view override returns (uint256) {
        uint256 value = usdt.balanceOf(address(this));
        (uint160 sqrtP, , , , , , ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();
        value += _wethToUsdt(IERC20(WETH).balanceOf(address(this)), sqrtP);
        value += _positionValueUSDT();
        return value;
    }
}

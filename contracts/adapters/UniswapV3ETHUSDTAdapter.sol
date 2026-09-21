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
    function transferFrom(
    address from,
    address to,
    uint256 tokenId
) external;
    function positions(uint256 tokenId) external view returns (
        uint96, address, address, address, uint24, int24, int24, uint128,
        uint256, uint256, uint128, uint128
    );
}

interface IUniswapV3Pool {
    function slot0() external view returns (uint160, int24, uint16, uint16, uint16, uint8, bool);
}
interface IMigratableUniswapV3Adapter {
    function acceptMigration(
        uint256 tokenId,
        int24 lower,
        int24 upper
    ) external;
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
    address public migrationSource;
    uint256 public positionTokenId;
    int24 public tickLower;
    int24 public tickUpper;

    modifier onlyPool() {
        require(msg.sender == pool, "Only InvestmentPool");
        _;
    }

    constructor(address poolAddress, address migrationSourceAddress) {
    require(poolAddress != address(0), "Invalid pool");
    require(migrationSourceAddress != address(0), "Invalid migration source");

    pool = poolAddress;
    usdt = IERC20(USDT);
    migrationSource = migrationSourceAddress;
    }
    function migrateTo(address newAdapter) external onlyPool {
    require(newAdapter != address(0), "Invalid new adapter");
    require(newAdapter != address(this), "Same adapter");
    require(positionTokenId != 0, "No position");

    uint256 tokenId = positionTokenId;

    // РџРµСЂРµРґР°С‘Рј NFT РЅРѕРІРѕРјСѓ Р°РґР°РїС‚РµСЂСѓ
    INonfungiblePositionManager(POSITION_MANAGER).transferFrom(
        address(this),
        newAdapter,
        tokenId
    );

    // РџРµСЂРµРґР°С‘Рј РѕСЃС‚Р°РІС€РёРµСЃСЏ С‚РѕРєРµРЅС‹
    uint256 usdtBalance = usdt.balanceOf(address(this));
    if (usdtBalance > 0) {
        usdt.safeTransfer(newAdapter, usdtBalance);
    }

    uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
    if (wethBalance > 0) {
        IERC20(WETH).safeTransfer(newAdapter, wethBalance);
    }

    // РќРѕРІС‹Р№ Р°РґР°РїС‚РµСЂ С„РёРєСЃРёСЂСѓРµС‚ РїРѕР»СѓС‡РµРЅРЅС‹Р№ NFT
    IMigratableUniswapV3Adapter(newAdapter).acceptMigration(
        tokenId,
        tickLower,
        tickUpper
    );

    // РЎС‚Р°СЂС‹Р№ Р°РґР°РїС‚РµСЂ Р±РѕР»СЊС€Рµ РЅРµ СЃС‡РёС‚Р°РµС‚ РїРѕР·РёС†РёСЋ СЃРІРѕРµР№
    positionTokenId = 0;
    tickLower = 0;
    tickUpper = 0;
}
    function acceptMigration(
    uint256 tokenId,
    int24 lower,
    int24 upper
) external {
    require(msg.sender == migrationSource, "Only migration source");

    positionTokenId = tokenId;
    tickLower = lower;
    tickUpper = upper;

     migrationSource = address(0);
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
        function _mulDivUp(
        uint256 a,
        uint256 b,
        uint256 denominator
    ) internal pure returns (uint256 result) {
        require(denominator != 0, "Division by zero");

        result = UniFullMath.mulDiv(a, b, denominator);

        if (mulmod(a, b, denominator) != 0) {
            require(result < type(uint256).max, "mulDiv overflow");
            result++;
        }
    }

    function _getAmountsForL(
        uint128 l,
        uint160 sqrtP,
        int24 lower,
        int24 upper
    ) internal pure returns (
        uint256 amount0,
        uint256 amount1
    ) {
        if (l == 0) return (0, 0);

        return _amountsForLiquidity(
            sqrtP,
            UniTickMath.getSqrtRatioAtTick(lower),
            UniTickMath.getSqrtRatioAtTick(upper),
            l
        );
    }

    function _estimateLiquidityForTarget(
    uint256 neededUSDT,
    uint128 currentLiquidity,
    uint160 sqrtP,
    int24 lower,
    int24 upper
) internal pure returns (uint128) {
    if (neededUSDT == 0 || currentLiquidity == 0) {
        return 0;
    }

    (
        uint256 fullAmount0,
        uint256 fullAmount1
    ) = _getAmountsForL(
        currentLiquidity,
        sqrtP,
        lower,
        upper
    );

    uint256 fullValue =
        fullAmount1 +
        _wethToUsdt(fullAmount0, sqrtP);

    if (fullValue <= neededUSDT) {
        return currentLiquidity;
    }

    uint256 estimatedL =
        _mulDivUp(
            neededUSDT,
            uint256(currentLiquidity),
            fullValue
        );

    if (estimatedL > currentLiquidity) {
        return currentLiquidity;
    }

    return uint128(estimatedL);
}

    function _quoteWethToUsdt(
        uint256 wethAmount
    ) internal returns (uint256 amountOut) {
        if (wethAmount == 0) return 0;

        (
            amountOut,
            ,
            ,

        ) = IQuoterV2(QUOTER).quoteExactInputSingle(
            IQuoterV2.QuoteExactInputSingleParams({
                tokenIn: WETH,
                tokenOut: USDT,
                amountIn: wethAmount,
                fee: POOL_FEE,
                sqrtPriceLimitX96: 0
            })
        );
    }

    function _findLiquidityForTarget(
        uint256 neededUSDT,
        uint128 currentLiquidity,
        uint160 sqrtP,
        int24 lower,
        int24 upper
    ) internal returns (uint128 requiredLiquidity) {
        if (neededUSDT == 0 || currentLiquidity == 0) {
            return 0;
        }

        uint128 lLow = _estimateLiquidityForTarget(
            neededUSDT,
            currentLiquidity,
            sqrtP,
            lower,
            upper
        );

        (
            uint256 a0Low,
            uint256 a1Low
        ) = _getAmountsForL(
            lLow,
            sqrtP,
            lower,
            upper
        );

        uint256 yLow =
            a1Low +
            _quoteWethToUsdt(a0Low);

        if (yLow >= neededUSDT) {
            return lLow;
        }

        if (lLow == currentLiquidity) {
            return currentLiquidity;
        }

        uint128 lHigh = currentLiquidity;

        (
            uint256 a0High,
            uint256 a1High
        ) = _getAmountsForL(
            lHigh,
            sqrtP,
            lower,
            upper
        );

        uint256 yHigh =
            a1High +
            _quoteWethToUsdt(a0High);

        if (yHigh < neededUSDT) {
            return currentLiquidity;
        }

        uint256 neededDelta =
            neededUSDT - yLow;

        uint256 lRange =
            uint256(lHigh - lLow);

        uint256 yRange =
    yHigh - yLow;

if (yRange == 0) {
    return lHigh;
}

        uint256 lDelta =
            _mulDivUp(
                neededDelta,
                lRange,
                yRange
            );

        uint128 lCandidate =
            lLow + uint128(lDelta);

        if (lCandidate > lHigh) {
            lCandidate = lHigh;
        }

        (
            uint256 a0Cand,
            uint256 a1Cand
        ) = _getAmountsForL(
            lCandidate,
            sqrtP,
            lower,
            upper
        );

        uint256 yCand =
            a1Cand +
            _quoteWethToUsdt(a0Cand);

        if (yCand >= neededUSDT) {
            return lCandidate;
        }

        return lHigh;
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
     * This adapter is a shared vault around one Uniswap V3 NFT.
     *
     * The InvestmentPool owns shares of the aggregate adapter assets.
     * Therefore we must release only enough assets for this withdrawal.
     */

    /*
     * 1. Collect currently owed fees.
     *
     * Collected fees become idle adapter assets and therefore
     * remain part of the shared adapter value.
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

    /*
     * 2. Read current price.
     */
    (
        uint160 sqrtP,
        ,
        ,
        ,
        ,
        ,

    ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();

    /*
     * 3. Read idle balances.
     */
    uint256 idleUSDT =
        usdt.balanceOf(address(this));

    uint256 idleWETH =
        IERC20(WETH).balanceOf(address(this));

    /*
     * 4. Convert idle WETH to its approximate USDT value.
     */
    uint256 idleWETHValue =
        _wethToUsdt(idleWETH, sqrtP);

    /*
     * 5. Calculate current value of the active V3 position.
     */
    uint256 positionValue =
        _positionValueUSDT();

    /*
     * Total assets controlled by this adapter.
     */
    uint256 totalValue =
        idleUSDT +
        idleWETHValue +
        positionValue;

    require(
        totalValue > 0,
        "No adapter assets"
    );

    /*
     * The adapter must never return more than it actually owns.
     */
    uint256 target =
        amount < totalValue
            ? amount
            : totalValue;

    /*
     * 6. Use idle USDT first.
     */
    uint256 remaining =
        target > idleUSDT
            ? target - idleUSDT
            : 0;

    /*
     * If idle USDT is already enough, no LP liquidity needs
     * to be removed.
     */
    if (remaining > 0) {

        /*
         * 7. Use idle WETH next.
         *
         * Calculate the amount of WETH required from the current
         * spot price. The actual swap is protected by the quoter
         * and 0.50% slippage limit.
         */
        if (idleWETH > 0) {
    uint256 wethNeeded;

    if (remaining >= idleWETHValue) {
        wethNeeded = idleWETH;
    } else {
        uint256 intermediate =
            _mulDivUp(
                remaining,
                uint256(1) << 96,
                uint256(sqrtP)
            );

        wethNeeded =
            _mulDivUp(
                intermediate,
                uint256(1) << 96,
                uint256(sqrtP)
            );

        if (wethNeeded > idleWETH) {
            wethNeeded = idleWETH;
        }
    }

    if (wethNeeded > 0) {
    uint256 quoted = _quoteWethToUsdt(wethNeeded);
    require(quoted > 0, "Zero WETH quote");

    IERC20(WETH).forceApprove(SWAP_ROUTER, wethNeeded);

    uint256 minOut = (quoted * (BPS - SWAP_SLIPPAGE_BPS)) / BPS;

    ISwapRouter02(SWAP_ROUTER).exactInputSingle(
        ISwapRouter02.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: USDT,
            fee: POOL_FEE,
            recipient: address(this),
            amountIn: wethNeeded,
            amountOutMinimum: minOut, // РСЃРїСЂР°РІР»РµРЅРѕ: РґРѕР±Р°РІР»РµРЅР° Р·Р°С‰РёС‚Р° 0.5%
            sqrtPriceLimitX96: 0
        })
    );
}

        /*
         * Refresh USDT after using idle WETH.
         */
        uint256 currentUSDT =
            usdt.balanceOf(address(this));

        /*
         * 8. If USDT is still insufficient, release only part
         * of the active V3 liquidity.
         */
        if (currentUSDT < target) {

            require(
                positionTokenId != 0,
                "No position"
            );

            (
                uint128 liquidity,
                int24 lower,
                int24 upper,
                ,

            ) = _positionInfo();

            require(
                liquidity > 0,
                "No liquidity"
            );

            /*
             * Determine how much USDT is still required.
             */
            uint256 neededUSDT =
                target - currentUSDT;

            /*
             * Get current pool price again.
             */
            (
                uint160 currentSqrtP,
                ,
                ,
                ,
                ,
                ,

            ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();

                        require(
                currentSqrtP > 0,
                "Invalid pool price"
            );

            /*
             * Estimate the amount of liquidity required.
             *
             * We intentionally calculate from the actual token
             * amounts of the current V3 position rather than from
             * an arbitrary fixed percentage.
             */
            uint128 liquidityToRemove =
    _findLiquidityForTarget(
        neededUSDT,
        liquidity,
        currentSqrtP,
        lower,
        upper
    );

require(
    liquidityToRemove > 0,
    "No liquidity to remove"
);

            /*
             * Remember WETH balance BEFORE removing liquidity.
             *
             * Only the WETH delta generated by this operation
             * will be swapped below.
             */
            uint256 wethBefore =
                IERC20(WETH).balanceOf(address(this));

            /*
             * 9. Remove ONLY the required amount of liquidity.
             */
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
             * 10. Collect the tokens released by the decrease.
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

            /*
             * If all liquidity was removed, the NFT no longer
             * represents an active LP position.
             */
            if (liquidityToRemove == liquidity) {
                positionTokenId = 0;
                tickLower = 0;
                tickUpper = 0;
            }

            /*
             * 11. Convert only NEWLY RECEIVED WETH to USDT.
             */
            uint256 wethAfter =
                IERC20(WETH).balanceOf(address(this));

            uint256 recoveredWETH =
                wethAfter > wethBefore
                    ? wethAfter - wethBefore
                    : 0;

                        if (recoveredWETH > 0) {
    uint256 quoted = _quoteWethToUsdt(recoveredWETH);
    require(quoted > 0, "Zero WETH quote");

    IERC20(WETH).forceApprove(SWAP_ROUTER, recoveredWETH);

    uint256 minOut = (quoted * (BPS - SWAP_SLIPPAGE_BPS)) / BPS;

    ISwapRouter02(SWAP_ROUTER).exactInputSingle(
        ISwapRouter02.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: USDT,
            fee: POOL_FEE,
            recipient: address(this),
            amountIn: recoveredWETH,
            amountOutMinimum: minOut, // РСЃРїСЂР°РІР»РµРЅРѕ: РґРѕР±Р°РІР»РµРЅР° Р·Р°С‰РёС‚Р° 0.5%
            sqrtPriceLimitX96: 0
        })
    );
}

        /*
     * 12. Check the final amount actually available.
     */
    uint256 finalUSDT =
        usdt.balanceOf(address(this));

    require(
        finalUSDT >= target,
        "Insufficient recovered USDT"
    );

    /*
     * Return exactly the amount requested by InvestmentPool.
     *
     * Any remaining adapter assets stay in the shared adapter
     * and continue backing the other investments.
     */
    returned = target;

    require(
        returned > 0,
        "No USDT recovered"
    );

    usdt.safeTransfer(
        msg.sender,
        returned
    );
}
}
}
}

    function totalAssets() external view override returns (uint256) {
        uint256 value = usdt.balanceOf(address(this));
        (uint160 sqrtP, , , , , , ) = IUniswapV3Pool(UNISWAP_V3_POOL).slot0();
        value += _wethToUsdt(IERC20(WETH).balanceOf(address(this)), sqrtP);
        value += _positionValueUSDT();
        return value;
    }
}

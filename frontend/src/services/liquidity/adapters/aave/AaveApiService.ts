import { ethers } from "ethers";
import type { AaveMarket } from "./types";

export class AaveApiService {
  private readonly provider = new ethers.JsonRpcProvider(
    "https://bsc-dataseed.binance.org"
  );

  private readonly poolAddress =
    "0x6807dc923806fE8Fd134338EABCA509979a7e0cB";

  private readonly usdtAddress =
    "0x55d398326f99059fF775485246999027B3197955";

  private readonly poolAbi = [
    "function getReserveData(address asset) view returns (uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowIndex, uint128 currentVariableBorrowRate, uint128 currentStableBorrowRate, uint40 lastUpdateTimestamp, uint16 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt)"
  ];

  async getMarkets(): Promise<AaveMarket[]> {
    const pool = new ethers.Contract(
      this.poolAddress,
      this.poolAbi,
      this.provider
    );

    const data = await pool.getReserveData(this.usdtAddress);

    const liquidityRate = BigInt(data.currentLiquidityRate);

    const ray = 10n ** 27n;
    const secondsPerYear = 365 * 24 * 60 * 60;

    const rate = Number(liquidityRate) / Number(ray);

    const supplyApy =
      (Math.pow(1 + rate / secondsPerYear, secondsPerYear) - 1) * 100;

    return [
      {
        address: this.usdtAddress,
        symbol: "USDT",
        name: "Tether USD",
        supplyApy: supplyApy,
        borrowApy: 0,
        liquidity: 0,
      },
    ];
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.getMarkets();
      return true;
    } catch {
      return false;
    }
  }
}

export const aaveApiService = new AaveApiService();

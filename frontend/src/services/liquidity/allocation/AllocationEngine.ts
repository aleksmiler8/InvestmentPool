import type { VenusMarket } from "../adapters/venus/types";

export interface AllocationRecommendation {
  asset: string;

  allocation: number;

  supplyApy: number;
}

export class AllocationEngine {
  calculate(
    markets: VenusMarket[],
  ): AllocationRecommendation[] {
    const sorted = [...markets]
      .filter(
        (market) =>
          Number(market.supplyApy) > 0,
      )
      .sort(
        (a, b) =>
          Number(b.supplyApy) -
          Number(a.supplyApy),
      );

    const totalApy = sorted.reduce(
      (sum, market) =>
        sum + Number(market.supplyApy),
      0,
    );

    return sorted.map((market) => ({
      asset: market.symbol,

      supplyApy: Number(
        market.supplyApy,
      ),

      allocation:
        totalApy === 0
          ? 0
          : Number(
              (
                (Number(
                  market.supplyApy,
                ) /
                  totalApy) *
                100
              ).toFixed(2),
            ),
    }));
  }
}

export const allocationEngine =
  new AllocationEngine();
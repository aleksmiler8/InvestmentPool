import type { VenusMarket } from "../adapters/venus/types";

export interface InvestmentRecommendation {
  market: VenusMarket;
  score: number;
}

export class InvestmentAnalyzer {
  analyze(
    markets: VenusMarket[],
  ): InvestmentRecommendation[] {
    return [...markets]
      .filter((market) => market.supplyApy > 0)
      .sort(
        (a, b) => b.supplyApy - a.supplyApy,
      )
      .map((market) => ({
        market,
        score: market.supplyApy,
      }));
  }
}

export const investmentAnalyzer =
  new InvestmentAnalyzer();
import type { VenusMarket } from "./types";
export class VenusApiService {
  private readonly baseUrl = "https://api.venus.io";

  async getMarkets(): Promise<VenusMarket[]> {
  const response = await fetch(
    `${this.baseUrl}/markets?chainId=56&limit=20&page=0`,
  );

  if (!response.ok) {
    throw new Error(`Venus API error: ${response.status}`);
  }

  const data = await response.json();

  return data.result
    .filter((market: any) => market.isListed)
    .map((market: any) => ({
      address: market.address,
      symbol: market.symbol,
      name: market.name ?? market.symbol,

      supplyApy: Number(market.supplyApy ?? 0),
      borrowApy: Number(market.borrowApy ?? 0),

      liquidity: Number(market.liquidityCents ?? 0),
    }));
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

export const venusApiService = new VenusApiService();
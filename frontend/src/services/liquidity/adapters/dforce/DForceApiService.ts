export type DForceMarket = {
  symbol?: string;
  name?: string;
  underlying_symbol?: string;
  decimals?: string | number;
  address?: string;
  supplyAPY: number;
};

type DForceMarketsResponse = {
  supplyMarkets?: Array<{
    symbol?: string;
    name?: string;
    underlying_symbol?: string;
    decimals?: string | number;
    address?: string;
    supplyAPY?: string | number;
  }>;
};

const DFORCE_MARKETS_URL = "/api/dforce/markets";

export const dforceApiService = {
  async getMarkets(): Promise<DForceMarket[]> {
    const response = await fetch(DFORCE_MARKETS_URL, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`DForce API HTTP ${response.status}`);
    }

    const data = (await response.json()) as DForceMarketsResponse;

    return (data.supplyMarkets ?? []).map((market) => ({
      symbol: market.symbol,
      name: market.name,
      underlying_symbol: market.underlying_symbol,
      decimals: market.decimals,
      address: market.address,
      // dForce returns APY scaled by 1e18.
      supplyAPY: Number(market.supplyAPY ?? 0),
    }));
  },
};

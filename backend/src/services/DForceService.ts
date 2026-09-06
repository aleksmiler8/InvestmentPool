import axios from "axios";

const DFORCE_MARKETS_URL =
  "https://app.dforce.network/general/markets?network=bsc";

export class DForceService {
  async getMarkets() {
    const response = await axios.get(DFORCE_MARKETS_URL, {
      timeout: 15000,
    });

    const markets = response.data?.supplyMarkets ?? [];

    return markets.map((market: any) => ({
      symbol: market.symbol,
      name: market.name,
      underlying_symbol: market.underlying_symbol,
      decimals: market.decimals,
      address: market.address,
      // dForce API APY is scaled by 1e18.
      supplyAPY: Number(market.supplyAPY ?? 0) / 1e16,
    }));
  }
}

export const dforceService = new DForceService();

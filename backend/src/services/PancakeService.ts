import axios from "axios";

export class PancakeService {
  async getPools() {
    const { data } = await axios.get(
      "https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools?page=1"
    );

    return data.data.map((pool: any) => ({
      id: pool.id,
      pair: pool.attributes.name,
      tvl: Number(pool.attributes.reserve_in_usd ?? 0),
      volume: Number(pool.attributes.volume_usd?.h24 ?? 0),
      price: Number(pool.attributes.base_token_price_usd ?? 0),
    }));
  }
}

export const pancakeService = new PancakeService();
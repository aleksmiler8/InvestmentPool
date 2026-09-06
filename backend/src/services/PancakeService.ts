import axios from "axios";

export class PancakeService {
  async getPools() {
    const poolAddress =
      "0x16b9a82891338f9bA80E2D6970FddA79D1eb0daE";

    const { data } = await axios.get(
      `https://api.geckoterminal.com/api/v2/networks/bsc/pools/${poolAddress}`
    );

    const attributes = data.data.attributes;

    const tvl =
      Number(attributes.reserve_in_usd ?? 0);

    const volume =
      Number(attributes.volume_usd?.h24 ?? 0);

    /*
     * PancakeSwap V2 trading fee = 0.25%.
     *
     * APR is an estimate based on the last 24h
     * trading volume and current TVL.
     */
    const feeRate = 0.0025;

    const apy =
      tvl > 0
        ? (volume * feeRate / tvl) * 365 * 100
        : 0;

    return [
      {
        id: data.data.id,
        pair: attributes.name,
        tvl,
        volume,
        price: Number(
          attributes.base_token_price_usd ?? 0
        ),
        apy,
      },
    ];
  }
}

export const pancakeService =
  new PancakeService();
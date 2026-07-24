export class PancakeAdapter
{
  async getInfo() {
    return {
      id: "pancakeswap",

      name: "PancakeSwap",

      network: "bsc",

      status: "active",

      supportedAssets: [],

      supportedOperations: [
        "deposit",
        "withdraw",
      ],

      version: "1.0",

      lastUpdated: new Date(),
    };
  }

  async healthCheck() {
    return true;
  }

  async getBalance() {
    return 0n;
  }

  async getMarkets() {
    return [];
  }

  async getApy() {
    return {};
  }

  async deposit(
  _asset: string,
  _amount: bigint,
): Promise<string> {
  throw new Error("Not implemented");
}

  async withdraw(
 _asset: string,
  _amount: bigint,
): Promise<string> {
  throw new Error("Not implemented");
}
}

export const pancakeAdapter =
  new PancakeAdapter();
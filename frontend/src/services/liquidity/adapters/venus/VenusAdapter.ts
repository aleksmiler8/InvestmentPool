import { venusApiService } from "./VenusApiService";
import type { VenusMarket } from "./types";
import type {
  ProtocolAdapter,
  ProtocolInfo,
} from "../../registry";

export class VenusAdapter implements ProtocolAdapter {
  async getInfo(): Promise<ProtocolInfo> {
    return {
      id: "venus",
      name: "Venus",
      network: "bsc",
      status: "active",

      supportedAssets: [],

      supportedOperations: [
        "deposit",
        "withdraw",
        "borrow",
        "repay",
        "claimRewards",
      ],

      version: "1.0.0",

      lastUpdated: new Date(),
    };
  }

  async healthCheck(): Promise<boolean> {
  return await venusApiService.healthCheck();
}

  async getBalance(): Promise<bigint> {
    return 0n;
  }

  async getMarkets(): Promise<VenusMarket[]> {
  return await venusApiService.getMarkets();
}

  async getApy(): Promise<Record<string, number>> {
    return {};
  }

  async deposit(): Promise<string> {
    throw new Error("Not implemented");
  }

  async withdraw(): Promise<string> {
    throw new Error("Not implemented");
  }
}
import type { PancakePool } from "./types";

export class PancakeApiService {
  async getPools(): Promise<PancakePool[]> {
    const response = await fetch(
  "/api/pancakeswap/pools"
);

    if (!response.ok) {
      throw new Error("Failed to load PancakeSwap pools");
    }

    return await response.json();
  }
}

export const pancakeApiService = new PancakeApiService();
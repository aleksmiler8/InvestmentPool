import type { BeefyVault } from "./types";

export class BeefyApiService {
  async getVaults(): Promise<BeefyVault[]> {
    const response = await fetch("/api/beefy/vaults");

    if (!response.ok) {
      throw new Error("Failed to load Beefy vaults");
    }

    return await response.json();
  }
}

export const beefyApiService = new BeefyApiService();
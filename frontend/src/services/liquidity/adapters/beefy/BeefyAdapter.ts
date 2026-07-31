import { beefyApiService } from "./BeefyApiService";
import type { BeefyVault } from "./types";

import type {
  ILiquidityAdapter,
  LiquidityPool,
} from "../ILiquidityAdapter";

export class BeefyAdapter implements ILiquidityAdapter {
  async getVaults(): Promise<LiquidityPool[]> {
    return beefyApiService.getVaults();
  }

  async getVault(id: string): Promise<BeefyVault | null> {
    const vaults = await this.getVaults();

    return vaults.find(v => v.id === id) ?? null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getVaults();
      return true;
    } catch {
      return false;
    }
  }
}

import { pancakeApiService } from "./PancakeApiService";
import type { PancakePool } from "./types";

export class PancakeAdapter {
  async getPools(): Promise<PancakePool[]> {
    return pancakeApiService.getPools();
  }

  async getPool(id: string): Promise<PancakePool | null> {
    const pools = await this.getPools();
    return pools.find(pool => pool.id === id) ?? null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getPools();
      return true;
    } catch {
      return false;
    }
  }
}

export const pancakeAdapter = new PancakeAdapter();
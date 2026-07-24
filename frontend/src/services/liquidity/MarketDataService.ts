import { venusApiService } from "./adapters/venus/VenusApiService";
import type { VenusMarket } from "./adapters/venus/types";
import { pancakeApiService } from "./adapters/pancakeswap/PancakeApiService";
import type { PancakePool } from "./adapters/pancakeswap/types";
import { beefyApiService } from "./adapters/beefy/BeefyApiService";
import type { BeefyVault } from "./adapters/beefy/types";

export class MarketDataService {
  private venusMarkets: VenusMarket[] = [];
  private pancakePools: PancakePool[] = [];
  private beefyVaults: BeefyVault[] = [];

  private lastUpdate: Date | null = null;

  private refreshPromise: Promise<void> | null = null;

  async refresh(force = false): Promise<void> {
    if (
      !force &&
      this.lastUpdate &&
      Date.now() - this.lastUpdate.getTime() < 30000
    ) {
      return;
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
  try {
    const [venusMarkets, pancakePools, beefyVaults] = await Promise.all([
  venusApiService.getMarkets(),
  pancakeApiService.getPools(),
  beefyApiService.getVaults(),
]);

    this.venusMarkets = venusMarkets;
    this.pancakePools = pancakePools;
    this.beefyVaults = beefyVaults;

    this.lastUpdate = new Date();
  } finally {
    this.refreshPromise = null;
  }
})();

    return this.refreshPromise;
  }

  getVenusMarkets(): VenusMarket[] {
    return this.venusMarkets;
  }
  getPancakePools(): PancakePool[] {
  return this.pancakePools;
  }
  getBeefyVaults(): BeefyVault[] {
  return this.beefyVaults;
}

  getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  isLoaded(): boolean {
    return this.venusMarkets.length > 0;
  }
}

export const marketDataService = new MarketDataService();
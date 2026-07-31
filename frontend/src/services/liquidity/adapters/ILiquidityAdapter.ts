export interface LiquidityPool {
  id: string;
  name: string;
  platform: string;
  network: string;
  token: string;
  earnedToken: string;

  status: string;
  oracle: string;

  apy: number | null;
  tvl: number | null;
}

export interface ILiquidityAdapter {
  getVaults(): Promise<LiquidityPool[]>;

  getVault(id: string): Promise<LiquidityPool | null>;

  isAvailable(): Promise<boolean>;
}
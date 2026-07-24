export interface MarketInfo {
  id: string;

  protocol: string;

  asset: string;

  apy: number;

  tvl: bigint;

  liquidity: bigint;

  utilization?: number;

  riskScore?: number;

  updatedAt: Date;
}
export interface ProtocolMarket {
  protocol: string;

  address: string;

  symbol: string;

  name: string;

  supplyApy: number;

  borrowApy: number;

  liquidity: number;

  totalSupply: number;

  totalBorrow: number;
}
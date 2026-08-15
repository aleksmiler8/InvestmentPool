/**
 * Investment Pool
 * Version 3
 * Liquidity Manager
 * Protocol Registry
 */

export type ProtocolId =
  | "venus"
  | "pancakeswap"
  | "beefy"
  | "aave";

export type Network =
  | "bsc"
  | "ethereum"
  | "polygon"
  | "arbitrum";

export type ProtocolStatus =
  | "active"
  | "inactive"
  | "maintenance";

export type ProtocolOperation =
  | "deposit"
  | "withdraw"
  | "borrow"
  | "repay"
  | "claimRewards";

export interface SupportedAsset {
  symbol: string;
  address: string;
  decimals: number;
}

export interface ProtocolInfo {
  id: ProtocolId;
  name: string;
  network: Network;
  status: ProtocolStatus;

  supportedAssets: SupportedAsset[];
  supportedOperations: ProtocolOperation[];

  version: string;
  lastUpdated: Date;
}

export interface ProtocolAdapter {
  getInfo(): Promise<ProtocolInfo>;

  healthCheck(): Promise<boolean>;

  getBalance(): Promise<bigint>;

  getMarkets(): Promise<unknown[]>;

  getApy(): Promise<Record<string, number>>;

  deposit(asset: string, amount: bigint): Promise<string>;

  withdraw(asset: string, amount: bigint): Promise<string>;
}

export interface RegisteredProtocol {
  info: ProtocolInfo;
  adapter: ProtocolAdapter;
}
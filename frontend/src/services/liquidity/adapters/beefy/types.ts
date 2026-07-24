export interface BeefyVault {
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
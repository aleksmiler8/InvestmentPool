import axios from "axios";

export class BeefyService {
  async getVaults() {
    const [vaultsResponse, apyResponse, tvlResponse] = await Promise.all([
      axios.get("https://api.beefy.finance/vaults"),
      axios.get("https://api.beefy.finance/apy"),
      axios.get("https://api.beefy.finance/tvl"),
    ]);

    const vaults = vaultsResponse.data;
    const apy = apyResponse.data;
    const tvl = tvlResponse.data;
    console.log("Beefy APY:", apy);

    return vaults
      .filter((vault: any) => vault.status === "active")
      .map((vault: any) => ({
        id: vault.id,
        name: vault.name,
        platform: vault.platform,
        network: vault.network,
        token: vault.token,
        earnedToken: vault.earnedToken,

        status: vault.status,
        oracle: vault.oracle ?? "",

        apy: apy[vault.id] ?? null,
        tvl: tvl[vault.id] ?? null,
      }));
  }
}

export const beefyService = new BeefyService();
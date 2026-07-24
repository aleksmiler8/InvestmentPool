import { useEffect, useState } from "react";

import { marketDataService } from "../../services/liquidity/MarketDataService";
import type { BeefyVault } from "../../services/liquidity/adapters/beefy/types";

export default function BeefyVaultsPanel() {
  const [vaults, setVaults] = useState<BeefyVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadVaults = async () => {
    try {
      setLoading(true);
      setError("");

      await marketDataService.refresh();

      setVaults(marketDataService.getBeefyVaults());
    } catch (e) {
      console.error(e);
      setError("Failed to load Beefy vaults");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaults();
  }, []);

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "14px",
        padding: "20px",
        background: "#ffffff",
        marginTop: "20px",
      }}
    >
      <h3>🐮 Beefy Vaults</h3>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <p>
            Vaults loaded: <b>{vaults.length}</b>
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th align="left">Name</th>
<th align="left">Platform</th>
<th align="left">Network</th>
<th align="left">Token</th>
<th align="left">Earned Token</th>
<th align="right">APY</th>
<th align="right">TVL</th>
              </tr>
            </thead>

            <tbody>
              {vaults.slice(0, 20).map((vault) => (
                <tr key={vault.id}>
  <td>{vault.name}</td>
  <td>{vault.platform}</td>
  <td>{vault.network}</td>
  <td>{vault.token}</td>
  <td>{vault.earnedToken}</td>

  <td align="right">
    {vault.apy != null
      ? `${(vault.apy * 100).toFixed(2)} %`
      : "-"}
  </td>

  <td align="right">
    {vault.tvl != null
      ? `$${Math.round(vault.tvl).toLocaleString()}`
      : "-"}
  </td>
</tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
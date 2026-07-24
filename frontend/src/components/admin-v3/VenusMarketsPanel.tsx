import { useEffect, useState } from "react";

import { marketDataService } from "../../services/liquidity/MarketDataService";
import type { VenusMarket } from "../../services/liquidity/adapters/venus/types";
export default function VenusMarketsPanel() {
  const [markets, setMarkets] = useState<VenusMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const loadMarkets = async () => {
    try {
      setLoading(true);
      setError("");

      await marketDataService.refresh();

setMarkets(
  marketDataService.getVenusMarkets()
);

      setUpdatedAt(
        new Date()
          .toLocaleString("ru-RU")
          .replace(",", "")
      );
    } catch (e) {
      console.error(e);
      setError("Failed to load Venus markets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarkets();
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3 style={{ margin: 0 }}>🏦 Venus Markets</h3>

        <button
          onClick={loadMarkets}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            cursor: "pointer",
            background: "#ffffff",
            fontWeight: "bold",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th align="left">Symbol</th>
                <th align="left">Name</th>
                <th align="right">Supply APY</th>
                <th align="right">Borrow APY</th>
                <th align="right">Liquidity</th>
              </tr>
            </thead>

            <tbody>
              {markets.map((market) => (
                <tr key={market.address}>
                  <td>{market.symbol}</td>

                  <td>{market.name}</td>

                  <td align="right">
                    {Number(market.supplyApy).toFixed(2)} %
                  </td>

                  <td align="right">
                    {Number(market.borrowApy).toFixed(2)} %
                  </td>

                  <td align="right">
  {Number.isFinite(Number(market.liquidity))
    ? Number(market.liquidity).toLocaleString("ru-RU")
    : "-"}
</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p
            style={{
              marginTop: "20px",
              color: "#666",
              fontSize: "14px",
            }}
          >
            Updated:<br />
            <b>{updatedAt}</b>
          </p>
        </>
      )}
    </div>
  );
}
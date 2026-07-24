import { useEffect, useState } from "react";

import { pancakeApiService } from "../../services/liquidity/adapters/pancakeswap/PancakeApiService";
import type { PancakePool } from "../../services/liquidity/adapters/pancakeswap/types";

export default function PancakePoolsPanel() {
  const [pools, setPools] = useState<PancakePool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await pancakeApiService.getPools();

        console.log("Pancake Pools:", data);

        setPools(data);
      } catch (e) {
        console.error(e);
        setError("Failed to load PancakeSwap pools");
      } finally {
        setLoading(false);
      }
    };

    load();
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
      <h3>🥞 PancakeSwap Pools</h3>

      {loading && <p>Loading...</p>}

      {!loading && error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {!loading && !error && (
        <>
          <p>
            Pools loaded: <b>{pools.length}</b>
          </p>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
  <tr>
    <th align="left">Pool</th>
    <th align="right">TVL</th>
    <th align="right">24h Volume</th>
    <th align="right">Price</th>
  </tr>
</thead>

            <tbody>
  {pools.map((pool) => (
    <tr key={pool.id}>
      <td>{pool.pair}</td>

      <td align="right">
        ${pool.tvl.toLocaleString()}
      </td>

      <td align="right">
        ${pool.volume.toLocaleString()}
      </td>

      <td align="right">
        ${pool.price.toFixed(6)}
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
import { useEffect, useState } from "react";

import { marketDataService } from "../../services/liquidity/MarketDataService";
import { investmentAnalyzer } from "../../services/liquidity/analyzer/InvestmentAnalyzer";
import type { InvestmentRecommendation } from "../../services/liquidity/analyzer/InvestmentAnalyzer";

export default function InvestmentRecommendationsPanel() {
  const [recommendations, setRecommendations] = useState<InvestmentRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState("");
  const [showDepositModal, setShowDepositModal] = useState(false);
const [selectedAsset, setSelectedAsset] = useState("");
const [fromToken, setFromToken] = useState("USDT");
const [amount, setAmount] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        await marketDataService.refresh();

console.log(
  "Markets:",
  marketDataService.getVenusMarkets()
);
const result =
  investmentAnalyzer.analyze(
    marketDataService.getVenusMarkets()
  );
  console.log("Recommendations:", result);

        setRecommendations(result.slice(0, 10));
        setUpdatedAt(
  new Date()
    .toLocaleString("ru-RU")
    .replace(",", "")
);
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
      <h3>📈 Investment Recommendations</h3>

      {loading ? (
        <p>Loading...</p>
      ) : (
  <>
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th align="left">Rank</th>
<th align="left">Asset</th>
<th align="right">Supply APY</th>
<th align="center">Action</th>
        </tr>
      </thead>

      <tbody>
        {recommendations.map((item, index) => (
          <tr key={item.market.address}>
            <td>{index + 1}</td>

            <td>{item.market.symbol}</td>

            <td align="right">
              {Number(item.market.supplyApy).toFixed(2)} %
            </td>
            <td align="center">
  <button
  onClick={() => {
    setSelectedAsset(item.market.symbol);
    setShowDepositModal(true);
  }}
>
  Deposit
</button>
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
{showDepositModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        width: "400px",
      }}
    >
      <h2>Deposit</h2>

      <p>
  <b>Asset:</b> {selectedAsset}
</p>

<div style={{ marginTop: "20px" }}>
  <label>
    <b>From</b>
  </label>

  <br />

  <select
    value={fromToken}
    onChange={(e) => setFromToken(e.target.value)}
    style={{
      width: "100%",
      padding: "8px",
      marginTop: "8px",
    }}
  >
    <option>USDT</option>
    <option>BNB</option>
    <option>USDC</option>
    <option>ETH</option>
    <option>BTC</option>
  </select>
</div>

<div style={{ marginTop: "20px" }}>
  <label>
    <b>Amount</b>
  </label>

  <br />

  <input
    type="number"
    placeholder="0.00"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    style={{
      width: "100%",
      padding: "8px",
      marginTop: "8px",
      boxSizing: "border-box",
    }}
  />
</div>

      <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "24px",
  }}
>
  <button
    onClick={() => setShowDepositModal(false)}
  >
    Close
  </button>

  <button
    onClick={() => {
      console.log(
  JSON.stringify(
    {
      asset: selectedAsset,
      from: fromToken,
      amount,
    },
    null,
    2
  )
);

      setShowDepositModal(false);
    }}
  >
    Deposit
  </button>
</div>
    </div>
  </div>
)}
    </div>
  );
}
import { liquidityService } from "../../services/liquidity/LiquidityService";
export default function LiquidityPanel() {
    const protocols = liquidityService.getProtocols();
    const activeProtocols = protocols.filter(
  (protocol) => protocol.status === "connected"
).length;
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
      <h3 style={{ marginTop: 0 }}>
        🌐 Liquidity
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th align="left">Protocol</th>
            <th align="left">Status</th>
            <th align="left">Allocation</th>
          </tr>
        </thead>

        <tbody>
  {protocols.map((protocol) => (
    <tr key={protocol.id}>
      <td>{protocol.name}</td>

      <td>
        {protocol.status === "connected"
          ? "🟢 Connected"
          : protocol.status === "coming-soon"
          ? "⚪ Coming Soon"
          : "🔴 Offline"}
      </td>

      <td>{protocol.allocation}%</td>
    </tr>
  ))}
        </tbody>
      </table>

      <p style={{ marginTop: "15px" }}>
  Active Protocols: <b>{activeProtocols} / {protocols.length}</b>
</p>
    </div>
  );
}
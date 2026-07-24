export default function SystemPanel() {
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
        🟢 System
      </h3>

      <p>
        🌐 Network: <b>BNB Mainnet</b>
      </p>

      <p>
        💼 Wallet: <b>Connected</b>
      </p>

      <p>
        🔗 Active Protocols: <b>1</b>
      </p>

      <p>
        🚀 Investment Pool: <b>Version 3.0.0-dev</b>
      </p>

      <p>
        ✅ Status: <span style={{ color: "green" }}>Online</span>
      </p>
    </div>
  );
}
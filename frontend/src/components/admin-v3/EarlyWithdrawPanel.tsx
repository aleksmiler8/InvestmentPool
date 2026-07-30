type Props = {
  earlyFee: string;
  setEarlyFee: (value: string) => void;
  onSave: () => void;
};

export default function EarlyWithdrawPanel({
  earlyFee,
  setEarlyFee,
  onSave,
}: Props) {
  const inputStyle = {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontWeight: "bold",
    marginBottom: "6px",
    display: "block",
  };

  const saveButtonStyle = {
    marginTop: "20px",
    padding: "14px",
    width: "100%",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "bold",
    fontSize: "16px",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "14px",
        padding: "20px",
        background: "#ffffff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>
        💸 Early Withdraw Fee
      </h3>

      <div>
        <label style={labelStyle}>Fee (%)</label>

        <input
          style={inputStyle}
          value={earlyFee}
          onChange={(e) => setEarlyFee(e.target.value)}
          placeholder="15.00"
        />
      </div>

      <button
        style={saveButtonStyle}
        onClick={onSave}
      >
        💾 Save Fee
      </button>
    </div>
  );
}
type Props = {
  dayRate: string;
  weekRate: string;
  monthRate: string;
  threeMonthRate: string;
  sixMonthRate: string;
  yearRate: string;

  setDayRate: (value: string) => void;
  setWeekRate: (value: string) => void;
  setMonthRate: (value: string) => void;
  setThreeMonthRate: (value: string) => void;
  setSixMonthRate: (value: string) => void;
  setYearRate: (value: string) => void;

  onSave: (period: number, value: string) => void;
};

export default function RewardRatesPanel({
  dayRate,
  weekRate,
  monthRate,
  threeMonthRate,
  sixMonthRate,
  yearRate,

  setDayRate,
  setWeekRate,
  setMonthRate,
  setThreeMonthRate,
  setSixMonthRate,
  setYearRate,

  onSave,
}: Props) {
  const inputStyle = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "15px",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontWeight: 600,
    marginBottom: "4px",
    display: "block",
    fontSize: "14px",
  };

  const saveButtonStyle = {
    height: "42px",
    minWidth: "90px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  };

  const rowStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 90px",
    gap: "10px",
    alignItems: "end",
  };

  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "14px",
        padding: "20px",
        background: "#fff",
      }}
    >
      <h3
        style={{
          marginTop: 0,
          marginBottom: "18px",
        }}
      >
        📈 Reward Rates
      </h3>

      <div
        style={{
          display: "grid",
          gap: "10px",
        }}
      >
        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>1 Day (%)</label>

            <input
              style={inputStyle}
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
            />
          </div>

          <button
            style={saveButtonStyle}
            onClick={() => onSave(86400, dayRate)}
          >
            💾 Save
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>7 Days (%)</label>

            <input
              style={inputStyle}
              value={weekRate}
              onChange={(e) => setWeekRate(e.target.value)}
            />
          </div>

          <button
            style={saveButtonStyle}
            onClick={() => onSave(604800, weekRate)}
          >
            💾 Save
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>30 Days (%)</label>

            <input
              style={inputStyle}
              value={monthRate}
              onChange={(e) => setMonthRate(e.target.value)}
            />
          </div>

          <button
            style={saveButtonStyle}
            onClick={() => onSave(2592000, monthRate)}
          >
            💾 Save
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>90 Days (%)</label>

            <input
              style={inputStyle}
              value={threeMonthRate}
              onChange={(e) => setThreeMonthRate(e.target.value)}
            />
          </div>

          <button
            style={saveButtonStyle}
            onClick={() => onSave(7776000, threeMonthRate)}
          >
            💾 Save
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>180 Days (%)</label>

            <input
              style={inputStyle}
              value={sixMonthRate}
              onChange={(e) => setSixMonthRate(e.target.value)}
            />
          </div>

          <button
            style={saveButtonStyle}
            onClick={() => onSave(15552000, sixMonthRate)}
          >
            💾 Save
          </button>
        </div>

        <div style={rowStyle}>
          <div>
            <label style={labelStyle}>365 Days (%)</label>

            <input
              style={inputStyle}
              value={yearRate}
              onChange={(e) => setYearRate(e.target.value)}
            />
          </div>

          <button
            style={saveButtonStyle}
            onClick={() => onSave(31536000, yearRate)}
          >
            💾 Save
          </button>
        </div>
      </div>
    </div>
  );
}
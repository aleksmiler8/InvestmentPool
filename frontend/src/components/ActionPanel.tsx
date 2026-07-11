type Props = {
  amount: string;
  setAmount: (value: string) => void;

  period: number;
  setPeriod: (value: number) => void;

  onCreate: () => void;
  t: (key: string) => string;
};

export default function ActionPanel({
  amount,
  setAmount,
  period,
  setPeriod,
  onCreate,
  t,
}: Props) {
  return (
    <>
      <h3>{t("actions")}</h3>

      <input
        type="text"
        placeholder={t("enterAmount")}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={{
          width: "100%",
          padding: "14px",
          marginBottom: "20px",
          borderRadius: "12px",
          border: "1px solid #d1d5db",
          fontSize: "16px",
          boxSizing: "border-box",
        }}
      />

      <h3 style={{ marginBottom: "15px" }}>
        Investment Period
      </h3>

      <div
        style={{
          display: "grid",
          gap: "10px",
          marginBottom: "25px",
        }}
      >
        <label>
          <input
            type="radio"
            checked={period === 86400}
            onChange={() => setPeriod(86400)}
          />{" "}
          1 Day
        </label>

        <label>
          <input
            type="radio"
            checked={period === 604800}
            onChange={() => setPeriod(604800)}
          />{" "}
          7 Days
        </label>

        <label>
          <input
            type="radio"
            checked={period === 2592000}
            onChange={() => setPeriod(2592000)}
          />{" "}
          30 Days
        </label>

        <label>
          <input
            type="radio"
            checked={period === 7776000}
            onChange={() => setPeriod(7776000)}
          />{" "}
          90 Days
        </label>

        <label>
          <input
            type="radio"
            checked={period === 15552000}
            onChange={() => setPeriod(15552000)}
          />{" "}
          180 Days
        </label>

        <label>
          <input
            type="radio"
            checked={period === 31536000}
            onChange={() => setPeriod(31536000)}
          />{" "}
          365 Days
        </label>
      </div>

      <button
        onClick={onCreate}
        style={{
          width: "100%",
          padding: "16px",
          background: "#14b8a6",
          color: "#fff",
          border: "none",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          transition: "0.2s",
        }}
      >
        {t("createInvestment")}
      </button>
    </>
  );
}
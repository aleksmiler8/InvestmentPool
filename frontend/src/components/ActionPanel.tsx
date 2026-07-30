import "./ActionPanel.css";

type Props = {
  amount: string;
  setAmount: (value: string) => void;

  period: number;
  setPeriod: (value: number) => void;

  occupiedPeriods: Record<number, boolean>;
  rewardRates: Record<number, string>;

  onCreate: () => Promise<void>;
  t: (key: string) => string;
  loading: boolean;
};

export default function ActionPanel({
  amount,
  setAmount,
  period,
  setPeriod,
  occupiedPeriods,
  rewardRates,
  onCreate,
  loading,
  t,
}: Props) {
  const periods = [
    { value: 86400, label: "1 Day" },
    { value: 604800, label: "7 Days" },
    { value: 2592000, label: "30 Days" },
    { value: 7776000, label: "90 Days" },
    { value: 15552000, label: "180 Days" },
    { value: 31536000, label: "365 Days" },
  ];

  return (
    <div className="action-panel">
      <h3>{t("actions")}</h3>

      <input
        className="action-input"
        type="text"
        placeholder={t("enterAmount")}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <h3 className="period-title">
        Investment Period
      </h3>

      <div className="period-list">
        {periods.map((item) => {
          const occupied = occupiedPeriods[item.value];

          return (
            <label
              key={item.value}
              className={`period-item ${
  occupied ? "occupied" : ""
} ${
  period === item.value ? "selected" : ""
}`}
            >
              <input
                type="radio"
                checked={period === item.value}
                disabled={occupied}
                onChange={() => setPeriod(item.value)}
              />

              <span>
                {occupied ? "🔒 " : ""}
                {item.label}
              </span>

              <span className="period-rate">
                {rewardRates[item.value] ?? "0.00"}%
              </span>
            </label>
          );
        })}
      </div>

      <button
        className="create-button"
        onClick={onCreate}
        disabled={loading}
      >
        {t("createInvestment")}
      </button>
    </div>
  );
}
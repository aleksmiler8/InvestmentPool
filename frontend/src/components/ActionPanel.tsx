import "./ActionPanel.css";

type Props = {
  amount: string;
  setAmount: (value: string) => void;

  period: number;
  setPeriod: (value: number) => void;

  occupiedPeriods: Record<number, boolean>;

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
  onCreate,
  loading,
  t,
}: Props) {
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
  <label className="period-item">
    <input
      type="radio"
      checked={period === 86400}
      disabled={occupiedPeriods[86400]}
      onChange={() => setPeriod(86400)}
    />
    1 Day
  </label>

  <label className="period-item">
    <input
      type="radio"
      checked={period === 604800}
      disabled={occupiedPeriods[604800]}
      onChange={() => setPeriod(604800)}
    />
    7 Days
  </label>

  <label className="period-item">
    <input
      type="radio"
      checked={period === 2592000}
      disabled={occupiedPeriods[2592000]}
      onChange={() => setPeriod(2592000)}
    />
    30 Days
  </label>

  <label className="period-item">
    <input
      type="radio"
      checked={period === 7776000}
      disabled={occupiedPeriods[7776000]}
      onChange={() => setPeriod(7776000)}
    />
    90 Days
  </label>

  <label className="period-item">
    <input
      type="radio"
      checked={period === 15552000}
      disabled={occupiedPeriods[15552000]}
      onChange={() => setPeriod(15552000)}
    />
    180 Days
  </label>

  <label className="period-item">
    <input
      type="radio"
      checked={period === 31536000}
      disabled={occupiedPeriods[31536000]}
      onChange={() => setPeriod(31536000)}
    />
    365 Days
  </label>
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
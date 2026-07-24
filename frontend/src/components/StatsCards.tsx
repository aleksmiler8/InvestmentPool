import "./StatsCards.css";

type Props = {
  investmentCount: number;
  totalDeposit: string;
  totalReward: string;
  t: (key: string) => string;
};

export default function StatsCards({
  investmentCount,
  totalDeposit,
  totalReward,
  t,
}: Props) {
  return (
    <div className="stats-container">
      <div className="stats-card">
        <h4>{t("activeInvestments")}</h4>
        <h2>{investmentCount}</h2>
      </div>

      <div className="stats-card">
        <h4>{t("totalDeposit")}</h4>
        <h2>{totalDeposit} USDT</h2>
      </div>

      <div className="stats-card">
        <h4>{t("receivedProfit")}</h4>
        <h2>{totalReward} USDT</h2>
      </div>
    </div>
  );
}
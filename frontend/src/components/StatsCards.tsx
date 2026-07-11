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
  const cardStyle = {
    flex: 1,
    minWidth: "220px",
    background: "#ffffff",
    border: "1px solid #e7e7e7",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    textAlign: "center" as const,
    transition: "0.25s",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        flexWrap: "wrap",
        marginBottom: "30px",
      }}
    >
      <div style={cardStyle}>
        <h4>{t("activeInvestments")}</h4>
        <h2 style={{ color: "#16b6b6" }}>
          {investmentCount}
        </h2>
      </div>

      <div style={cardStyle}>
        <h4>{t("totalDeposit")}</h4>
        <h2 style={{ color: "#16b6b6" }}>
          {totalDeposit} USDT
        </h2>
      </div>

      <div style={cardStyle}>
        <h4>{t("receivedProfit")}</h4>
        <h2 style={{ color: "#16b6b6" }}>
          {totalReward} USDT
        </h2>
      </div>
    </div>
  );
}
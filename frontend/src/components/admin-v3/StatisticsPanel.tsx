type Props = {
  totalInvestors: string;
  totalDeposits: string;
  contractBalance: string;
};

export default function StatisticsPanel({
  totalInvestors,
  totalDeposits,
  contractBalance,
}: Props) {
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
        📊 Statistics
      </h3>

      <p>
        👥 Total Investors: <b>{totalInvestors}</b>
      </p>

      <p>
        💰 Total Deposits: <b>{totalDeposits}</b>
      </p>

      <p>
        🏦 Contract Balance: <b>{contractBalance} USDT</b>
      </p>
    </div>
  );
}
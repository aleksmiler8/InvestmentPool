import { ethers } from "ethers";

type Props = {
  investments: any[];
  t: (key: string) => string;
  onWithdraw: (investment: any) => void;
};

export default function InvestmentList({
  investments,
  t,
  onWithdraw,
}: Props) {
  if (investments.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          textAlign: "center",
          color: "#777",
          background: "#fafafa",
        }}
      >
        {t("noInvestments")}
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);

  return (
    <>
      {investments.map((inv, index) => {
        const amount = ethers.formatUnits(inv[0], 18);
        const startTime = Number(inv[1]);
        const endTime = Number(inv[2]);
        const reward = ethers.formatUnits(inv[4], 18);
        const finished = inv[6];

        const finishDate = new Date(endTime * 1000);

        const remainingSeconds = Math.max(0, endTime - now);
        const remainingDays = Math.ceil(remainingSeconds / 86400);

        const total = endTime - startTime;
        const passed = Math.min(now - startTime, total);

        const progress =
          total > 0
            ? Math.min(100, Math.max(0, (passed / total) * 100))
            : 100;

        return (
          <div
            key={index}
            style={{
              background: "#ffffff",
              border: "1px solid #e7e7e7",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "#16b6b6",
              }}
            >
              💰 {t("investment")} #{index + 1}
            </h3>

            <p>
              <b>{t("amount")}:</b> {amount} USDT
            </p>

            <p>
              <b>{t("profit")}:</b> {reward} USDT
            </p>

            <p>
             <b>{t("finish")}:</b> {" "}
              {finishDate.toLocaleDateString()}
            </p>

            <p>
              <b>{t("remaining")}:</b>{" "}
              {finished ? "0 days" : `${remainingDays} days`}
            </p>

            <div
              style={{
                width: "100%",
                height: "10px",
                background: "#ececec",
                borderRadius: "20px",
                overflow: "hidden",
                margin: "15px 0",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  background: "#16b6b6",
                }}
              />
            </div>

            <p>
              <b>{t("status")}:</b>{" "}
              <span
                style={{
                  color: finished ? "#22c55e" : "#f59e0b",
                  fontWeight: "bold",
                }}
              >
                {finished ? "🟢 " : "🟡 "}
                {finished ? t("finished") : t("active")}
              </span>
            </p>

            <button
              onClick={() => onWithdraw(inv)}
              style={{
                marginTop: "10px",
                padding: "12px 20px",
                background: finished ? "#22c55e" : "#f59e0b",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              {finished ? t("claim") : t("earlyWithdraw")}
            </button>
          </div>
        );
      })}
    </>
  );
}
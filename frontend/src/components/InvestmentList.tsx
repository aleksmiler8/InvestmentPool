import "./InvestmentList.css";
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
      <div className="investment-empty">
        {t("noInvestments")}
      </div>
    );
  }

  const now = Math.floor(Date.now() / 1000);

  return (
    <>
      {investments.map((item, index) => {
  const inv = item.investment;
        const amount = ethers.formatUnits(inv[0], 18);
        const startTime = Number(inv[1]);
        const endTime = Number(inv[2]);
        const reward = ethers.formatUnits(inv[4], 18);

        const finished = inv[6] || now >= endTime;

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
            className="investment-card"
          >
            <h3 className="investment-title">
              💰 {t("investment")} #{index + 1}
            </h3>

            <p><b>{t("amount")}:</b> {amount} USDT</p>

            <p><b>{t("profit")}:</b> {reward} USDT</p>

            <p>
              <b>{t("finish")}:</b>{" "}
              {finishDate.toLocaleDateString()}
            </p>

            <p>
              <b>{t("remaining")}:</b>{" "}
              {finished
  ? `0 ${t("days")}`
  : `${remainingDays} ${t("days")}`}
            </p>

            <div className="progress">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <p>
              <b>{t("status")}:</b>{" "}
              <span
                className={
                  finished
                    ? "status-finished"
                    : "status-active"
                }
              >
                {finished ? "🟢 " : "🟡 "}
                {finished
                  ? t("finished")
                  : t("active")}
              </span>
            </p>

            <button
              className={
                finished
                  ? "claim-button"
                  : "withdraw-button"
              }
              onClick={() => onWithdraw(item)}
            >
              {finished
                ? t("claim")
                : t("earlyWithdraw")}
            </button>
          </div>
        );
      })}
    </>
  );
}
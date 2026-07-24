import { getContract } from "../contracts/InvestmentPool";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { AdminPanelV3 } from "./admin-v3";

type Props = {
  loadUser: () => Promise<void>;
};

export default function AdminPanel({
  loadUser,
}: Props) {
   const [dayRate, setDayRate] = useState("");
const [weekRate, setWeekRate] = useState("");
const [monthRate, setMonthRate] = useState("");
const [threeMonthRate, setThreeMonthRate] = useState("");
const [sixMonthRate, setSixMonthRate] = useState("");
const [yearRate, setYearRate] = useState("");
const [earlyFee, setEarlyFee] = useState("");
const [totalInvestors, setTotalInvestors] = useState("0");
const [totalDeposits, setTotalDeposits] = useState("0");
const [contractBalance, setContractBalance] = useState("0");
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
const toBasisPoints = (value: string) => {
  return Math.round(parseFloat(value || "0") * 100);
};
  const saveRewardRates = async () => {
  try {
    const contract = await getContract();

    const rates = [
      { period: 86400, value: dayRate },
      { period: 604800, value: weekRate },
      { period: 2592000, value: monthRate },
      { period: 7776000, value: threeMonthRate },
      { period: 15552000, value: sixMonthRate },
      { period: 31536000, value: yearRate },
    ];

    for (const rate of rates) {
      const tx = await contract.setRewardRate(
        rate.period,
        toBasisPoints(rate.value)
      );

      await tx.wait();
    }

    toast.success("Reward rates updated");

    await loadUser();

  } catch (e) {
    console.log(e);
    toast.error("Update failed");
  }
};
const loadStatistics = async () => {
  try {
    const contract = await getContract();

    const investors = await contract.totalInvestors();
    const deposits = await contract.totalDeposits();
    setDayRate(
  (Number(await contract.rewardRate(86400)) / 100).toString()
);

setWeekRate(
  (Number(await contract.rewardRate(604800)) / 100).toString()
);

setMonthRate(
  (Number(await contract.rewardRate(2592000)) / 100).toString()
);

setThreeMonthRate(
  (Number(await contract.rewardRate(7776000)) / 100).toString()
);

setSixMonthRate(
  (Number(await contract.rewardRate(15552000)) / 100).toString()
);

setYearRate(
  (Number(await contract.rewardRate(31536000)) / 100).toString()
);

setEarlyFee(
  (Number(await contract.earlyWithdrawFee()) / 100).toString()
);
    const balance = await contract.usdt().then(async (tokenAddress: string) => {
  const token = new ethers.Contract(
    tokenAddress,
    ["function balanceOf(address) view returns (uint256)"],
    contract.runner
  );

  return await token.balanceOf(await contract.getAddress());
});

    setTotalInvestors(investors.toString());
    setTotalDeposits(
  ethers.formatUnits(deposits, 18)
);
setContractBalance(
  ethers.formatUnits(balance, 18)
);

  } catch (e) {
    console.log(e);
  }
};
const saveEarlyWithdrawFee = async () => {
  try {
    const contract = await getContract();

    const tx = await contract.setEarlyWithdrawFee(
      toBasisPoints(earlyFee)
    );

    await tx.wait();

    toast.success("Early withdraw fee updated");

    await loadUser();

  } catch (e) {
    console.log(e);
    toast.error("Update failed");
  }
};
useEffect(() => {
  loadStatistics();
}, []);
return (
  <div
    style={{
      marginTop: "40px",
      padding: "25px",
      borderRadius: "16px",
      background: "#fff8e1",
      border: "2px solid #facc15",
    }}
  >
    <h2
      style={{
        marginTop: 0,
        color: "#b8860b",
      }}
    >
      👑 Administration
    </h2>

    <div
      style={{
        display: "grid",
        gap: "20px",
      }}
    >
      {/* Contract */}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "14px",
          padding: "20px",
          background: "#ffffff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          ⚙ Contract
        </h3>

        <p>Contract Status</p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={async () => {
              try {
                const contract = await getContract();

                const tx = await contract.pause();

                await tx.wait();

                toast.success("Contract paused");

                loadUser();
              } catch (e) {
                console.log(e);
              }
            }}
            style={{
              padding: "12px 24px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ⛔ Pause
          </button>

          <button
            onClick={async () => {
              try {
                const contract = await getContract();

                const tx = await contract.unpause();

                await tx.wait();

                toast.success("Contract resumed");

                loadUser();
              } catch (e) {
                console.log(e);
              }
            }}
            style={{
              padding: "12px 24px",
              background: "#22c55e",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            ▶ Resume
          </button>
        </div>
      </div>
      <div
  style={{
    border: "1px solid #ddd",
    borderRadius: "14px",
    padding: "20px",
    background: "#ffffff",
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
  <p>💰 Contract Balance: {contractBalance} USDT</p>
</div>

      {/* Reward Rates */}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "14px",
          padding: "20px",
          background: "#ffffff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>
          📈 Reward Rates
        </h3>

        <div
          style={{
            display: "grid",
            gap: "15px",
          }}
        >
          <div>
            <label style={labelStyle}>1 Day (%)</label>
            <input
              style={inputStyle}
              value={dayRate}
              onChange={(e) => setDayRate(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>7 Days (%)</label>
            <input
              style={inputStyle}
              value={weekRate}
              onChange={(e) => setWeekRate(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>30 Days (%)</label>
            <input
              style={inputStyle}
              value={monthRate}
              onChange={(e) => setMonthRate(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>90 Days (%)</label>
            <input
              style={inputStyle}
              value={threeMonthRate}
              onChange={(e) => setThreeMonthRate(e.target.value)}
            />
          </div>

          <div>
            <label style={labelStyle}>180 Days (%)</label>
            <input
              style={inputStyle}
              value={sixMonthRate}
              onChange={(e) => setSixMonthRate(e.target.value)}
            />
          </div>

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
            onClick={saveRewardRates}
          >
            💾 Save Reward Rates
          </button>
        </div>
      </div>
            {/* Early Withdraw Fee */}

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
          onClick={saveEarlyWithdrawFee}
        >
          💾 Save Fee
        </button>
      </div>
      <AdminPanelV3 />

    </div>
  
  </div>
);
}
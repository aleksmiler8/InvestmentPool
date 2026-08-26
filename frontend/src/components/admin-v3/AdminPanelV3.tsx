
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";

import { getContract } from "../../contracts/InvestmentPool";

import StatisticsPanel from "./StatisticsPanel";
import SystemPanel from "./SystemPanel";
import RewardRatesPanel from "./RewardRatesPanel";
import EarlyWithdrawPanel from "./EarlyWithdrawPanel";
import LiquidityPanel from "./LiquidityPanel";
import SwapAdminPanel from "./SwapAdminPanel";

const toBasisPoints = (value: string) =>
  Math.round(parseFloat(value || "0") * 100);

type Props = {
  loadUser: () => Promise<void>;
};

export default function AdminPanelV3({
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

      const balance = await contract
        .usdt()
        .then(async (tokenAddress: string) => {
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

  const saveRewardRate = async (
  period: number,
  value: string
) => {
  try {
    const contract = await getContract();

    const tx = await contract.setRewardRate(
      period,
      toBasisPoints(value)
    );

    await tx.wait();

    toast.success("Reward rate updated");

    await loadUser();
    await loadStatistics();
  } catch (e) {
    console.log(e);
    toast.error("Update failed");
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
await loadStatistics();
    } catch (e) {
      console.log(e);
      toast.error("Update failed");
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  return (
    <div className="admin-page">
      <h2 className="admin-title">
        👑 Administration
      </h2>

      <div className="admin-grid">

        <StatisticsPanel
          totalInvestors={totalInvestors}
          totalDeposits={totalDeposits}
          contractBalance={contractBalance}
        />

        <SystemPanel />

        <RewardRatesPanel
          dayRate={dayRate}
          weekRate={weekRate}
          monthRate={monthRate}
          threeMonthRate={threeMonthRate}
          sixMonthRate={sixMonthRate}
          yearRate={yearRate}
          setDayRate={setDayRate}
          setWeekRate={setWeekRate}
          setMonthRate={setMonthRate}
          setThreeMonthRate={setThreeMonthRate}
          setSixMonthRate={setSixMonthRate}
          setYearRate={setYearRate}
          onSave={saveRewardRate}
        />

        <EarlyWithdrawPanel
          earlyFee={earlyFee}
          setEarlyFee={setEarlyFee}
          onSave={saveEarlyWithdrawFee}
        />

        <LiquidityPanel
  loadUser={loadUser}
  loadStatistics={loadStatistics}
/>

        <SwapAdminPanel />

      </div>
    </div>
  );
}
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "./contracts/InvestmentPool";
import { getToken } from "./contracts/MyToken";
import { useTranslation } from "react-i18next";
import { useAccount } from "wagmi";

import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import InvestmentList from "./components/InvestmentList";
import ActionPanel from "./components/ActionPanel";
import AdminPanel from "./components/AdminPanel";

import toast from "react-hot-toast";

export default function Home() {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();

  const [, setRegistered] = useState(false);

  const [wallet, setWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");

  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState(30 * 24 * 60 * 60);

  const [investmentCount, setInvestmentCount] = useState(0);
  const [totalDeposit, setTotalDeposit] = useState("0");
  const [totalReward, setTotalReward] = useState("0");

  const [investments, setInvestments] = useState<any[]>([]);
  const [occupiedPeriods, setOccupiedPeriods] = useState<
    Record<number, boolean>
  >({});

  const [depositLoading, setDepositLoading] = useState(false);

  const [isOwner, setIsOwner] = useState(false);

  const [rewardRates, setRewardRates] = useState<Record<number, string>>({});

  useEffect(() => {
    if (isConnected && address) {
      loadUser();
    }
  }, [isConnected, address]);
    async function loadUser() {
    try {
      if (!isConnected || !address) return;

      const provider = new ethers.BrowserProvider(
        (window as any).ethereum
      );

      const balance = await provider.getBalance(address);
      setBnbBalance(ethers.formatEther(balance));

      const token = await getToken();
      const usdt = await token.balanceOf(address);
      setUsdtBalance(ethers.formatUnits(usdt, 18));

      setWallet(address);

      const contract = await getContract();

      setRewardRates({
  86400: (Number(await contract.rewardRate(86400)) / 100).toFixed(2),
  604800: (Number(await contract.rewardRate(604800)) / 100).toFixed(2),
  2592000: (Number(await contract.rewardRate(2592000)) / 100).toFixed(2),
  7776000: (Number(await contract.rewardRate(7776000)) / 100).toFixed(2),
  15552000: (Number(await contract.rewardRate(15552000)) / 100).toFixed(2),
  31536000: (Number(await contract.rewardRate(31536000)) / 100).toFixed(2),
});

      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === address.toLowerCase());

      const investor = await contract.getInvestor(address);

      setRegistered(Number(investor.investmentCount) > 0);

      setTotalDeposit(
        ethers.formatUnits(investor.totalInvested, 18)
      );

      setTotalReward(
        ethers.formatUnits(investor.totalReward, 18)
      );

      const list: any[] = [];
const occupied: Record<number, boolean> = {};

for (
  let i = 0;
  i < Number(investor.investmentCount);
  i++
) {
    const inv = await contract.getInvestment(address, i);

if (inv[5]) {
    list.push({
        index: i,
        investment: inv,
    });

    occupied[Number(inv[3])] = true;
}
}

setInvestments(list);
      setOccupiedPeriods(occupied);

      const activeCount = list.filter(
        (inv) => inv[5] === true
      ).length;

      setInvestmentCount(activeCount);
    } catch (e) {
      console.error(e);

      if (e instanceof Error) {
        toast.error(e.message);
      } else {
        toast.error("Unknown error");
      }
    }
  }
    return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "Arial",
        padding: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Header
          wallet={wallet}
          bnbBalance={bnbBalance}
          usdtBalance={usdtBalance}
        />

        <StatsCards
  investmentCount={investmentCount}
  totalDeposit={totalDeposit}
  totalReward={totalReward}
  t={t}
/>

        <h3>{t("my_investments")}</h3>

        <InvestmentList
          investments={investments}
          t={t}
          onWithdraw={async (inv) => {
            try {
              const contract = await getContract();

              const index = inv.index;

const endTime = Number(inv.investment[2]);
const isFinished =
  Date.now() / 1000 >= endTime;

              const tx = isFinished
                ? await contract.withdraw(index)
                : await contract.earlyWithdraw(index);

              await tx.wait();

              toast.success(t("withdraw_success"));

              await loadUser();
            } catch (e) {
              console.error(e);

              if (e instanceof Error) {
                toast.error(e.message);
              } else {
                toast.error("Unknown error");
              }
            }
          }}
        />
                <br />

        <hr />

        <ActionPanel
          amount={amount}
          setAmount={setAmount}
          period={period}
          setPeriod={setPeriod}
          occupiedPeriods={occupiedPeriods}
          rewardRates={rewardRates}
          loading={depositLoading}
          t={t}
          onCreate={async () => {
            if (!isConnected || !address) {
  toast.error("Please connect your wallet");
  return;
}
            try {
              if (!amount) {
                toast.error(t("enterAmountError"));
                return;
              }

              setDepositLoading(true);

              const token = await getToken();
              const contract = await getContract();

              const value = ethers.parseUnits(amount, 18);

              const approveTx = await token.approve(
                await contract.getAddress(),
                value
              );

              await approveTx.wait();

              const tx = await contract.deposit(
                value,
                period
              );

              await tx.wait();

              toast.success(t("successDeposit"));

              setAmount("");

              await loadUser();
            } catch (e) {
              console.error(e);

              if (e instanceof Error) {
                toast.error(e.message);
              } else {
                toast.error("Unknown error");
              }
            } finally {
              setDepositLoading(false);
            }
          }}
        />
                <br />

        {isOwner && (
          <AdminPanel
            loadUser={loadUser}
          />
        )}
      </div>
    </div>
  );
}
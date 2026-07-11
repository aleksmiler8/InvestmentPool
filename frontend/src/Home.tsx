import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContract } from "./contracts/InvestmentPool";
import { getToken } from "./contracts/MyToken";
import { useTranslation } from "react-i18next";
import Header from "./components/Header";
import StatsCards from "./components/StatsCards";
import InvestmentList from "./components/InvestmentList";
import ActionPanel from "./components/ActionPanel";
import toast from "react-hot-toast";
import AdminPanel from "./components/AdminPanel";
import { useAccount } from "wagmi";
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
const [isOwner, setIsOwner] = useState(false);
useEffect(() => {
    if (isConnected && address) {
        loadUser();
    }
}, [isConnected, address]);

 async function loadUser() {

    try {
        if (!isConnected || !address) return;

const provider = new ethers.BrowserProvider(window.ethereum);
const network = await provider.getNetwork();

console.log("Wallet:", address);

        const balance = await provider.getBalance(address);setBnbBalance(ethers.formatEther(balance));
        const token = await getToken();
const usdt = await token.balanceOf(address);
setUsdtBalance(ethers.formatUnits(usdt, 18));

        setWallet(address);

        const contract = await getContract();

const owner = await contract.owner();

setIsOwner(owner.toLowerCase() === address.toLowerCase());

        const count = await contract.getInvestmentCount(address);

setRegistered(Number(count) > 0);
const investor = await contract.getInvestor(address);
setInvestmentCount(Number(investor.investmentCount));
setTotalDeposit(ethers.formatUnits(investor.totalInvested, 18));
setTotalReward(ethers.formatUnits(investor.totalReward, 18));
const list = [];

for (let i = 0; i < Number(investor.investmentCount); i++) {
  const inv = await contract.getInvestment(address, i);
  list.push(inv); 
}

setInvestments(list);

    } catch (e) {
        console.log(e);

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

            const index = investments.indexOf(inv);

            const tx = inv.finished
    ? await contract.withdraw(index)
    : await contract.earlyWithdraw(index);

            await tx.wait();

            toast.success(t("withdraw_success"));

            loadUser();
        } catch (e) {
            console.log(e);
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
  t={t}
  onCreate={async () => {
    try {
      if (!amount) {
        toast.error(t("enterAmountError"));
        return;
      }

      const token = await getToken();
      const contract = await getContract();

      const value = ethers.parseUnits(amount, 18);

      const approveTx = await token.approve(
        await contract.getAddress(),
        value
      );
      await approveTx.wait();
      console.log("APPROVE OK");

console.log("Calling deposit...");

const tx = await contract.deposit(value, period);

console.log("Deposit tx:", tx);

      await tx.wait();

      toast.success(t("successDeposit"));

      setAmount("");
      loadUser();
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
{isOwner && (
  <AdminPanel loadUser={loadUser} />
)}
      </div>
    </div>
  );
}
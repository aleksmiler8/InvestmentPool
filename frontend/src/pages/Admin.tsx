import { useEffect, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";

import InvestmentPoolSwap from "../abis/InvestmentPoolSwap.json";

import {
  INVESTMENT_POOL_SWAP,
  USDT_ADDRESS,
} from "../contracts/addresses";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];
export default function Admin() {
  const [stats, setStats] = useState({
    reserveWallet: "",
    bnbBalance: "0",
    usdtBalance: "0",
    swapFee: "0",
  });

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
  try {
    if (!window.ethereum) return;

    const provider = new BrowserProvider(window.ethereum);

    const contract = new Contract(
      INVESTMENT_POOL_SWAP,
      InvestmentPoolSwap.abi,
      provider
    );

    const reserveWallet = await contract.reserveWallet();

    const feeBps = await contract.swapFeeBps();

    const bnbBalance = await provider.getBalance(reserveWallet);

    const usdt = new Contract(
      USDT_ADDRESS,
      ERC20_ABI,
      provider
    );

    const usdtBalance = await usdt.balanceOf(reserveWallet);

    setStats({
      reserveWallet,

      bnbBalance: Number(
        ethers.formatEther(bnbBalance)
      ).toFixed(4),

      usdtBalance: Number(
        ethers.formatUnits(usdtBalance, 18)
      ).toFixed(2),

      swapFee: (Number(feeBps) / 100).toString(),
    });
  } catch (err) {
    console.error(err);
  }
}

  return (
    <div style={{ padding: 30 }}>
      <h1>Admin Dashboard</h1>

      <hr />

      <h2>Reserve Wallet</h2>
      <p>{stats.reserveWallet}</p>

      <hr />

      <h2>Wallet Balance</h2>

      <p>BNB: {stats.bnbBalance}</p>

      <p>USDT: {stats.usdtBalance}</p>

      <hr />

      <h2>Swap Fee</h2>

      <p>{stats.swapFee}%</p>

      <button>
        Change Fee
      </button>
    </div>
  );
}
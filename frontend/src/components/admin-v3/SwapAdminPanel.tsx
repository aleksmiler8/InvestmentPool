import { useEffect, useState } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";

import InvestmentPoolSwap from "../../abis/InvestmentPoolSwap.json";
import {
  INVESTMENT_POOL_SWAP,
  USDT_ADDRESS,
} from "../../contracts/addresses";

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
];

export default function SwapAdminPanel() {
  const [reserveWallet, setReserveWallet] = useState("");
  const [bnbBalance, setBnbBalance] = useState("0");
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [swapFee, setSwapFee] = useState("0");
  const [newFee, setNewFee] = useState("");
const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const provider = new BrowserProvider(window.ethereum);

      const swap = new Contract(
        INVESTMENT_POOL_SWAP,
        InvestmentPoolSwap.abi,
        provider
      );

      const reserve = await swap.reserveWallet();
      const fee = await swap.swapFeeBps();

      setReserveWallet(reserve);
      setSwapFee((Number(fee) / 100).toString() + "%");

      const bnb = await provider.getBalance(reserve);

      const usdt = new Contract(
        USDT_ADDRESS,
        ERC20_ABI,
        provider
      );

      const usdtBalance = await usdt.balanceOf(reserve);

      setBnbBalance(ethers.formatEther(bnb));
      setUsdtBalance(ethers.formatUnits(usdtBalance, 18));
    } catch (e) {
      console.error(e);
    }
  }
  async function changeFee() {
  try {
    if (!newFee) return;

    setLoading(true);

    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const swap = new Contract(
      INVESTMENT_POOL_SWAP,
      InvestmentPoolSwap.abi,
      signer
    );

    const feeBps = Math.round(Number(newFee) * 100);

    const tx = await swap.setSwapFee(feeBps);

    await tx.wait();

    await loadData();

    setNewFee("");

    alert("Swap fee updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Failed to update fee.");
  } finally {
    setLoading(false);
  }
}

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
        💱 Swap Administration
      </h3>

      <p><b>Reserve Wallet:</b> {reserveWallet}</p>

      <p><b>BNB Balance:</b> {bnbBalance}</p>

      <p><b>USDT Balance:</b> {usdtBalance}</p>

      <p><b>Swap Fee:</b> {swapFee}</p>

      <div style={{ marginTop: "20px" }}>
  <input
    type="number"
    step="0.01"
    placeholder="Fee %"
    value={newFee}
    onChange={(e) => setNewFee(e.target.value)}
    style={{
      padding: "8px",
      width: "120px",
      marginRight: "10px",
    }}
  />

  <button
    onClick={changeFee}
    disabled={loading}
  >
    {loading ? "Updating..." : "Change Fee"}
  </button>
  </div>
    </div>
  );
}
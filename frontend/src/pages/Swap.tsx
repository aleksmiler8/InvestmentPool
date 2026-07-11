import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getToken } from "../contracts/MyToken";
import { getBNBPriceFromUSDT } from "../contracts/PancakeRouter";
import { swapBNBToUSDT } from "../services/swapService";

export default function Swap() {
  const navigate = useNavigate();
  const [swapDirection, setSwapDirection] = useState<"USDT_TO_BNB" | "BNB_TO_USDT">(
  "USDT_TO_BNB"
);
  const [bnbBalance, setBnbBalance] = useState("0");
const [usdtBalance, setUsdtBalance] = useState("0");
const [fromAmount, setFromAmount] = useState("");
const [toAmount, setToAmount] = useState("");
useEffect(() => {
  loadBalances();
}, []);

async function loadBalances() {
  try {
    if (!window.ethereum) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const address = await signer.getAddress();

    const bnb = await provider.getBalance(address);
    setBnbBalance(ethers.formatEther(bnb));
    setUsdtBalance("0");

    const token = await getToken();
    const usdt = await token.balanceOf(address);

    setUsdtBalance(ethers.formatUnits(usdt, 18));
    } catch (error) {
    console.error(error);
    alert(String(error));
}
}

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "520px",
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #e5e5e5",
          borderRadius: "12px",
          padding: "30px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            color: "#16b6b6",
            marginBottom: "8px",
          }}
        >
          ⇄ Swap
        </h2>

        <p
          style={{
            textAlign: "center",
            color: "#666",
            marginBottom: "30px",
          }}
        >
          Exchange USDT and BNB
        </p>

        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
            From
          </div>

          <input
  value={fromAmount}
  onChange={async (e) => {
    const value = e.target.value;
setFromAmount(value);

if (!value) {
  setToAmount("");
  return;
}

try {
  const amountIn = ethers.parseUnits(value, 18);

  const amountOut = await getBNBPriceFromUSDT(amountIn);

  setToAmount(
    ethers.formatEther(amountOut)
  );
} catch (e) {
  console.log(e);
}
  }}
  placeholder="0.00"
  style={{
  width: "100%",
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid #d9d9d9",
  fontSize: "16px",
  boxSizing: "border-box",
}}
/>

          <div
            style={{
              marginTop: "8px",
              color: "#16b6b6",
            }}
          >
            {swapDirection === "USDT_TO_BNB" ? "USDT" : "BNB"}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontSize: "28px",
            color: "#16b6b6",
            margin: "20px 0",
          }}
        >
          ⇅
        </div>

        <div>
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
            To
          </div>

          <input
            disabled
            value={toAmount}
            placeholder="0.00"
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "10px",
              border: "1px solid #d9d9d9",
              background: "#f8f8f8",
              fontSize: "16px",
              boxSizing: "border-box",
            }}
          />

          <div
            style={{
              marginTop: "8px",
              color: "#16b6b6",
            }}
          >
            {swapDirection === "USDT_TO_BNB" ? "BNB" : "USDT"}
          </div>
        </div>

        <div
          style={{
            marginTop: "30px",
            padding: "15px",
            background: "#fafafa",
            borderRadius: "10px",
            lineHeight: "1.8",
          }}
        >
          <div>Rate: --</div>
          <div>BNB Balance: {Number(bnbBalance).toFixed(4)}</div>
<div>USDT Balance: {Number(usdtBalance).toFixed(2)}</div>
        </div>

        <button
  onClick={() =>
    setSwapDirection((prev) =>
      prev === "USDT_TO_BNB" ? "BNB_TO_USDT" : "USDT_TO_BNB"
    )
  }
  style={{
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "28px",
    margin: "15px 0",
  }}
>
  ⇅
</button>
<button
  onClick={async () => {
  try {
    await swapBNBToUSDT(fromAmount);
    alert("Swap completed!");
    loadBalances();
  }catch (e: any) {
    console.error(e);
    alert(e?.message || String(e));
}
}}
  style={{
    width: "100%",
    marginTop: "20px",
    padding: "14px",
    border: "none",
    borderRadius: "10px",
    background: "#16b6b6",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  }}
>
  🔄 Swap
</button>

        <button
          onClick={() => navigate("/home")}
          style={{
            width: "100%",
            marginTop: "15px",
            padding: "12px",
            border: "none",
            borderRadius: "10px",
            background: "#efefef",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
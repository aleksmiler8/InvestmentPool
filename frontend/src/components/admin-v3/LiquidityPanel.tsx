import { useEffect, useState } from "react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import { getContract } from "../../contracts/InvestmentPool";
import { getUSDT } from "../../contracts/USDT";
import { venusApiService } from "../../services/liquidity/adapters/venus/VenusApiService";
import { beefyApiService } from "../../services/liquidity/adapters/beefy/BeefyApiService";
import { pancakeApiService } from "../../services/liquidity/adapters/pancakeswap/PancakeApiService";
type Props = {
  loadUser: () => Promise<void>;
  loadStatistics: () => Promise<void>;
};

export default function LiquidityPanel({
  loadUser,
  loadStatistics,
}: Props) {
  const protocols = [
  {
    id: "pool",
    name: "Pool",
    status: "connected",
  },
  {
    id: "reserve",
    name: "Reserve",
    status: "connected",
  },
  {
    id: "beefy",
    name: "Beefy",
    status: "connected",
  },
  {
    id: "venus",
    name: "Venus",
    status: "connected",
  },
  {
    id: "pancake",
    name: "Pancake",
    status: "connected",
  },
];
    const [showAllocateModal, setShowAllocateModal] = useState(false);
const [showTransferModal, setShowTransferModal] = useState(false);

const [selectedProtocol, setSelectedProtocol] = useState("Beefy");
const [fromProtocol, setFromProtocol] = useState("Beefy");
const [toProtocol, setToProtocol] = useState("Venus");
const [amount, setAmount] = useState("");
const [protocolBalances, setProtocolBalances] = useState({
  Pool: "0",
  Reserve: "0",
  Beefy: "0",
  Venus: "0",
  Pancake: "0",
});

const [protocolApy, setProtocolApy] = useState({
  Pool: "-",
  Reserve: "-",
  Beefy: "-",
  Venus: "-",
  Pancake: "-",
});

const [protocolPool, setProtocolPool] = useState({
  Pool: "-",
  Reserve: "-",
  Beefy: "-",
  Venus: "-",
  Pancake: "-",
});
const loadLiquidity = async () => {
  try {
    const contract = await getContract();
const usdt = await getUSDT();

const reserveWallet = await contract.reserveWallet();

const pool = await contract.protocolBalance(0);
const reserve = await usdt.balanceOf(reserveWallet);
const beefy = await contract.protocolBalance(2);
const venus = await contract.protocolBalance(3);
const pancake = await contract.protocolBalance(4);

    setProtocolBalances({
      Pool: ethers.formatUnits(pool, 18),
      Reserve: ethers.formatUnits(reserve, 18),
      Beefy: ethers.formatUnits(beefy, 18),
      Venus: ethers.formatUnits(venus, 18),
      Pancake: ethers.formatUnits(pancake, 18),
    });
  } catch (e) {
    console.error("Failed to load liquidity:", e);
  }
};

useEffect(() => {
  loadLiquidity();
  loadApy();
}, []);
   const loadApy = async () => {
  const [markets, vaults, pools] = await Promise.allSettled([
    venusApiService.getMarkets(),
    beefyApiService.getVaults(),
    pancakeApiService.getPools(),
  ]);

  // ---------- Venus ----------

  if (markets.status === "fulfilled") {
    const bestVenus = [...markets.value].sort(
      (a, b) => b.supplyApy - a.supplyApy
    )[0];

    if (bestVenus) {
      setProtocolApy((prev) => ({
        ...prev,
        Venus: `${bestVenus.supplyApy.toFixed(2)}%`,
      }));

      setProtocolPool((prev) => ({
        ...prev,
        Venus: bestVenus.symbol.replace(/^v/, ""),
      }));
    }
  } else {
    console.error("Venus error:", markets.reason);
  }

  // ---------- Beefy ----------

  if (vaults.status === "fulfilled") {
    const bestBeefy = [...vaults.value]
      .filter((vault) => vault.apy !== null)
      .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))[0];

    if (bestBeefy) {
      setProtocolApy((prev) => ({
        ...prev,
        Beefy: `${(bestBeefy.apy ?? 0).toFixed(2)}%`,
      }));

      setProtocolPool((prev) => ({
        ...prev,
        Beefy: bestBeefy.name,
      }));
    }
  } else {
    console.error("Beefy error:", vaults.reason);
  }

  // ---------- Pancake ----------

  if (pools.status === "fulfilled") {
    const bestPool = [...pools.value]
      .sort((a, b) => b.tvl - a.tvl)[0];

    if (bestPool) {
      setProtocolPool((prev) => ({
        ...prev,
        Pancake: bestPool.pair,
      }));

      setProtocolApy((prev) => ({
        ...prev,
        Pancake: `TVL $${bestPool.tvl.toLocaleString()}`,
      }));
    }
  } else {
    console.error("Pancake error:", pools.reason);
  }
};
const allocateFunds = async () => {
  try {
    const contract = await getContract();

    const protocolMap: Record<string, number> = {
  Beefy: 2,
  Venus: 3,
  Pancake: 4,
};

    const tx = await contract.allocateToProtocol(
      protocolMap[selectedProtocol],
      ethers.parseUnits(amount || "0", 18)
    );

    await tx.wait();

    toast.success("Funds allocated");

    setAmount("");
    setSelectedProtocol("Beefy");
    setShowAllocateModal(false);

    await loadUser();
    await loadStatistics();
    await loadLiquidity();
  } catch (e) {
    console.error(e);
    toast.error("Allocation failed");
  }
};
const transferFunds = async () => {
  try {
    const contract = await getContract();

    const protocolMap: Record<string, number> = {
  Beefy: 2,
  Venus: 3,
  Pancake: 4,
};

    const tx = await contract.transferBetweenProtocols(
      protocolMap[fromProtocol],
      protocolMap[toProtocol],
      ethers.parseUnits(amount || "0", 18)
    );

    await tx.wait();

    toast.success("Funds transferred");

    setAmount("");
    setFromProtocol("Beefy");
    setToProtocol("Venus");
    setShowTransferModal(false);

    await loadUser();
    await loadStatistics();
    await loadLiquidity();
  } catch (e) {
    console.error(e);
    toast.error("Transfer failed");
  }
};
const returnToPool = async () => {
  try {
    const contract = await getContract();

    const protocolMap: Record<string, number> = {
      Beefy: 2,
      Venus: 3,
      Pancake: 4,
    };

    const tx = await contract.returnToPool(
      protocolMap[fromProtocol],
      ethers.parseUnits(amount || "0", 18)
    );

    await tx.wait();

    toast.success("Funds returned to Pool");

    setAmount("");
    setFromProtocol("Venus");
    setShowTransferModal(false);

    await loadUser();
    await loadStatistics();
    await loadLiquidity();

  } catch (e) {
    console.error(e);
    toast.error("Return failed");
  }
};
const processReserveFees = async () => {
  try {
    const contract = await getContract();

    const tx = await contract.processReserveFees();

    await tx.wait();

    toast.success("Reserve fees processed");

    await loadUser();
    await loadStatistics();
    await loadLiquidity();
  } catch (e: any) {
  console.error(e);

  toast.error(
    e?.shortMessage ||
    e?.reason ||
    e?.message ||
    "Process failed"
  );
}
};

  const activeProtocols = protocols.length;
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
        🌐 Liquidity
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
  <tr>
    <th align="left">Protocol</th>
    <th align="left">Pool</th>
    <th align="left">APY</th>
    <th align="left">Status</th>
    <th align="left">Allocation</th>
  </tr>
</thead>

        <tbody>
  {protocols.map((protocol) => (
    <tr key={protocol.id}>
      <td>{protocol.name}</td>

      <td>
        {
          protocolPool[
            protocol.name as keyof typeof protocolPool
          ]
        }
      </td>

      <td>
        {
          protocolApy[
            protocol.name as keyof typeof protocolApy
          ]
        }
      </td>

      <td>🟢 Connected</td>

      <td>
        {
          protocolBalances[
            protocol.name as keyof typeof protocolBalances
          ]
        }{" "}
        USDT
      </td>
    </tr>
  ))}
</tbody>
      </table>

      <p style={{ marginTop: "15px" }}>
  Active Protocols: <b>{activeProtocols} / {protocols.length}</b>
</p>

<div
  style={{
    display: "flex",
    gap: "12px",
    marginTop: "20px",
    flexWrap: "wrap",
  }}
>
  <button
    onClick={() => setShowAllocateModal(true)}
  >
    Allocate
  </button>

  <button
    onClick={() => setShowTransferModal(true)}
  >
    Transfer
  </button>

  <button
    onClick={processReserveFees}
  >
    Process Reserve Fees
  </button>
</div>
    {showAllocateModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        width: "420px",
      }}
    >
      <h2>Allocate Funds</h2>

      <div style={{ marginTop: "20px" }}>
        <label>
          <b>Protocol</b>
        </label>

        <br />

        <select
          value={selectedProtocol}
          onChange={(e) =>
            setSelectedProtocol(e.target.value)
          }
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
          }}
        >
          <option>Beefy</option>
          <option>Venus</option>
          <option>Pancake</option>
        </select>
      </div>

      <div style={{ marginTop: "20px" }}>
        <label>
          <b>Amount (USDT)</b>
        </label>

        <br />

        <input
          type="number"
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value)
          }
          placeholder="0.00"
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        <button
          onClick={() =>
            setShowAllocateModal(false)
          }
        >
          Cancel
        </button>

        <button
  onClick={allocateFunds}
>
  Allocate
</button>
      </div>
    </div>
  </div>
)}
{showTransferModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#fff",
        padding: "24px",
        borderRadius: "12px",
        width: "420px",
      }}
    >
      <h2>Transfer Funds</h2>

      <div style={{ marginTop: "20px" }}>
        <label>
          <b>From Protocol</b>
        </label>

        <select
          value={fromProtocol}
          onChange={(e) => setFromProtocol(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
          }}
        >
          <option>Beefy</option>
          <option>Venus</option>
          <option>Pancake</option>
        </select>
      </div>

      <div style={{ marginTop: "20px" }}>
        <label>
          <b>To Protocol</b>
        </label>

        <select
          value={toProtocol}
          onChange={(e) => setToProtocol(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
          }}
        >
          <option>Beefy</option>
          <option>Venus</option>
          <option>Pancake</option>
        </select>
      </div>

      <div style={{ marginTop: "20px" }}>
        <label>
          <b>Amount (USDT)</b>
        </label>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "8px",
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "10px",
          marginTop: "24px",
        }}
      >
        <button onClick={() => setShowTransferModal(false)}>
  Cancel
</button>

<button onClick={returnToPool}>
  Return to Pool
</button>

<button onClick={transferFunds}>
  Transfer
</button>
      </div>
    </div>
  </div>
)}
</div>
);
}
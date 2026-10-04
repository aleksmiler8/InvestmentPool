const { ethers } = require("ethers");
require("dotenv").config();

const RPC =
  process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

const provider = new ethers.JsonRpcProvider(RPC);

const USDT = "0x55d398326f99059fF775485246999027B3197955";
const WALLET = "0x0c74c7e450Aff617208d022D023b0aCA66c69994";

const POOLS = [
  {
    name: "Pool #1 OLD",
    address: "0x184169C735Cd5336ad9D34E4188FB846aa76D402",
  },
  {
    name: "Pool #2 OLD",
    address: "0x8A89567a6863f8dd7cA2Cb235022c00cd95F40c0",
  },
  {
    name: "Pool #3 CURRENT",
    address: "0xaA1B6eb5Ade263A387B0F33e4d11Bbd1c2362215",
  },
];

const ADAPTERS = [
  {
    name: "Aave OLD",
    address: "0xa05aF259800e419B12Fa2fD8AEb8A12279f8F8C7",
  },
  {
    name: "DForce OLD",
    address: "0x465bBeF6829016507d966514Ab897B868ada56f6",
  },
  {
    name: "Aave PREVIOUS",
    address: "0x53e90c8Eab82C1c672019bF2D9214A567Aa197b7",
  },
  {
    name: "DForce PREVIOUS",
    address: "0xCcd0E6a745870A05881872d777Cc39982F883c20",
  },
  {
    name: "Aave CURRENT",
    address: "0xE89012A0ecf4887Dc6e2F8B588E776d127FaCC4b",
  },
  {
    name: "DForce CURRENT",
    address: "0x212fD8D805387A5a739d54e1b9B5424E281E74Ab",
  },
];

const erc20Abi = [
  "function balanceOf(address) view returns (uint256)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

const poolAbi = [
  "function owner() view returns(address)",
  "function usdt() view returns(address)",
  "function reserveWallet() view returns(address)",
  "function aaveAdapter() view returns(address)",
  "function dforceAdapter() view returns(address)",
  "function minimumInvestment() view returns(uint256)",
  "function paused() view returns(bool)",
];

const adapterAbi = [
  "function pool() view returns(address)",
  "function usdt() view returns(address)",
  "function iUSDT() view returns(address)",
  "function totalAssets() view returns(uint256)",
];

function fmt(value, decimals = 18) {
  return ethers.formatUnits(value, decimals);
}

async function checkNative(address) {
  const balance = await provider.getBalance(address);
  console.log(`BNB: ${fmt(balance, 18)}`);
}

async function checkUSDT(address, label) {
  const token = new ethers.Contract(USDT, erc20Abi, provider);
  const balance = await token.balanceOf(address);

  console.log(`${label} USDT: ${fmt(balance, 18)}`);
}

async function checkPool(pool) {
  console.log("\n========================================");
  console.log(pool.name);
  console.log("========================================");
  console.log("ADDRESS:", pool.address);

  const code = await provider.getCode(pool.address);

  if (code === "0x") {
    console.log("STATUS: NO CONTRACT");
    return;
  }

  const c = new ethers.Contract(pool.address, poolAbi, provider);

  try {
    console.log("OWNER:", await c.owner());
  } catch {
    console.log("OWNER: ERROR");
  }

  try {
    console.log("USDT:", await c.usdt());
  } catch {
    console.log("USDT: ERROR");
  }

  try {
    console.log("RESERVE:", await c.reserveWallet());
  } catch {
    console.log("RESERVE: ERROR");
  }

  try {
    console.log(
      "MINIMUM:",
      fmt(await c.minimumInvestment(), 18),
      "USDT"
    );
  } catch {
    console.log("MINIMUM: ERROR");
  }

  try {
    console.log("PAUSED:", await c.paused());
  } catch {
    console.log("PAUSED: ERROR");
  }

  try {
    console.log("AAVE:", await c.aaveAdapter());
  } catch {
    console.log("AAVE: ERROR");
  }

  try {
    console.log("DFORCE:", await c.dforceAdapter());
  } catch {
    console.log("DFORCE: ERROR");
  }

  await checkUSDT(pool.address, "POOL");
}

async function checkAdapter(adapter) {
  console.log("\n========================================");
  console.log(adapter.name);
  console.log("========================================");
  console.log("ADDRESS:", adapter.address);

  const code = await provider.getCode(adapter.address);

  if (code === "0x") {
    console.log("STATUS: NO CONTRACT");
    return;
  }

  const c = new ethers.Contract(
    adapter.address,
    adapterAbi,
    provider
  );

  try {
    console.log("POOL:", await c.pool());
  } catch {
    console.log("POOL: ERROR");
  }

  try {
    console.log("USDT:", await c.usdt());
  } catch {
    console.log("USDT: ERROR");
  }

  try {
    console.log("iUSDT:", await c.iUSDT());
  } catch {
    console.log("iUSDT: ERROR");
  }

  try {
    console.log(
      "TOTAL ASSETS:",
      fmt(await c.totalAssets(), 18),
      "USDT"
    );
  } catch {
    console.log("TOTAL ASSETS: ERROR");
  }

  await checkUSDT(adapter.address, "ADAPTER");
}

async function main() {
  console.log("========================================");
  console.log("        INVESTMENT POOL RECOVERY SCAN");
  console.log("========================================");

  console.log("Wallet:", WALLET);

  console.log("\n--- WALLET BALANCES ---");
  await checkNative(WALLET);
  await checkUSDT(WALLET, "WALLET");

  console.log("\n--- POOLS ---");

  for (const pool of POOLS) {
    await checkPool(pool);
  }

  console.log("\n--- ADAPTERS ---");

  for (const adapter of ADAPTERS) {
    await checkAdapter(adapter);
  }

  console.log("\n========================================");
  console.log("SCAN FINISHED");
  console.log("NO TRANSACTIONS WERE SENT");
  console.log("========================================");
}

main().catch((error) => {
  console.error("\nFATAL ERROR:");
  console.error(error);
  process.exit(1);
});
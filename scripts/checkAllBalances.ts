import { ethers } from "ethers";

const RPC = "https://bsc-dataseed.binance.org";

const USDT = "0x55d398326f99059fF775485246999027B3197955";
const WALLET = "0x0c74c7e450Aff617208d022D023b0aCA66c69994";
const HARNESS = "0xeF6203760A6423465AD481946645aa3a94680C98";
const ADAPTER = "0xdAB7ecaaD3bFf3B16B718242C745F061A7808490";

const provider = new ethers.JsonRpcProvider(RPC);

const iface = new ethers.Interface([
  "function balanceOf(address account) view returns(uint256)",
  "function allowance(address owner,address spender) view returns(uint256)"
]);

async function call(functionName: string, args: any[]) {
  const data = iface.encodeFunctionData(functionName, args);
  const result = await provider.call({ to: USDT, data });
  return iface.decodeFunctionResult(functionName, result)[0];
}

console.log("=== USDT BALANCES ===");

for (const [name, address] of [
  ["WALLET", WALLET],
  ["HARNESS", HARNESS],
  ["ADAPTER", ADAPTER]
]) {
  const balance = await call("balanceOf", [address]);
  console.log(
    `${name}:`,
    ethers.formatUnits(balance, 18),
    "USDT"
  );
}

console.log("\n=== ALLOWANCES ===");

const walletAllowance = await call(
  "allowance",
  [WALLET, HARNESS]
);

const harnessAllowance = await call(
  "allowance",
  [HARNESS, ADAPTER]
);

console.log(
  "WALLET -> HARNESS:",
  ethers.formatUnits(walletAllowance, 18),
  "USDT"
);

console.log(
  "HARNESS -> ADAPTER:",
  ethers.formatUnits(harnessAllowance, 18),
  "USDT"
);
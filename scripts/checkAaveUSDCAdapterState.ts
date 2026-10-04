import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";
const ADAPTER = "0xe0D6CfeF7B09b88D54E3c75F618c06100e628C9a";

console.log("=== CHECK AAVE USDC ADAPTER STATE ===");

const Pool = await ethers.getContractAt("InvestmentPoolV2", POOL);
const Adapter = await ethers.getContractAt("AaveUSDCAdapter", ADAPTER);

console.log("Pool:", POOL);
console.log("Adapter:", ADAPTER);

console.log("");
console.log("=== ADAPTER ADDRESSES ===");

const tokens = await Adapter.getTokens();

console.log("USDC:", tokens[0]);
console.log("aUSDC:", tokens[1]);
console.log("Aave Pool:", tokens[2]);
console.log("InvestmentPool:", tokens[3]);

console.log("");
console.log("=== AAVE STATE ===");

const underlying = await Adapter.balanceUnderlying();
const aTokenBalance = await Adapter.balanceOfAToken();

console.log(
    "Underlying balance:",
    ethers.formatUnits(underlying, 18),
    "USDC"
);

console.log(
    "aUSDC balance:",
    ethers.formatUnits(aTokenBalance, 6),
    "aUSDC"
);

console.log("");
console.log("=== POOL CONFIGURATION ===");

// Asset.USDC = 1
// Protocol.Aave = 5
const currentAdapter = await Pool.assetAdapters(1, 5);

console.log("Pool USDC/Aave adapter:", currentAdapter);

console.log("");
console.log("=== USDC ACCOUNTING ===");

const totalUSDC = await Pool.totalDepositsByAsset(1);
const activeUSDC = await Pool.totalActiveDepositsByAsset(1);

console.log(
    "Total USDC deposits:",
    ethers.formatUnits(totalUSDC, 18)
);

console.log(
    "Active USDC deposits:",
    ethers.formatUnits(activeUSDC, 18)
);

console.log("");
console.log("=== DONE ===");
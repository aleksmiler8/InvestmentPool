import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";
const ADAPTER = "0x932D40D68F6F29Ffc2fbcAd1B44d72D84C723F64";

console.log("=== CHECK VENUS USDC ADAPTER STATE ===");

const Pool = await ethers.getContractAt("InvestmentPoolV2", POOL);
const Adapter = await ethers.getContractAt("VenusUSDCAdapter", ADAPTER);

console.log("Pool:", POOL);
console.log("Adapter:", ADAPTER);

console.log("");
console.log("=== ADAPTER ADDRESSES ===");

const tokens = await Adapter.getTokens();

console.log("USDC:", tokens[0]);
console.log("vUSDC:", tokens[1]);
console.log("Pool:", tokens[2]);

console.log("");
console.log("=== VENUS STATE ===");

const underlying = await Adapter.balanceUnderlying.staticCall();
const vTokenBalance = await Adapter.balanceOfVToken();
const exchangeRate = await Adapter.exchangeRateStored();

console.log(
    "Underlying balance:",
    ethers.formatUnits(underlying, 18),
    "USDC"
);

console.log(
    "vUSDC balance:",
    ethers.formatUnits(vTokenBalance, 8),
    "vUSDC"
);

console.log(
    "Exchange rate:",
    exchangeRate.toString()
);

console.log("");
console.log("=== POOL CONFIGURATION ===");

// Asset.USDC = 1
// Protocol.Venus = 3
const currentAdapter = await Pool.assetAdapters(1, 3);

console.log("Pool USDC/Venus adapter:", currentAdapter);

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
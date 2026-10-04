import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";
const ADAPTER = "0xe0D6CfeF7B09b88D54E3c75F618c06100e628C9a";

// Asset.USDC = 1
// Protocol.Aave = 5
const USDC = 1;
const AAVE = 5;

console.log("=== SET AAVE USDC ADAPTER ===");

const [signer] = await ethers.getSigners();

console.log("Signer:", signer.address);
console.log("Pool:", POOL);
console.log("Adapter:", ADAPTER);

const Pool = await ethers.getContractAt("InvestmentPoolV2", POOL);

const owner = await Pool.owner();

console.log("Owner:", owner);

if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Signer is not Pool owner");
}

const tx = await Pool.setAssetAdapter(
    USDC,
    AAVE,
    ADAPTER
);

console.log("Transaction:", tx.hash);

const receipt = await tx.wait();

console.log("Confirmed in block:", receipt?.blockNumber);

const currentAdapter = await Pool.assetAdapters(USDC, AAVE);

console.log("USDC/Aave adapter:", currentAdapter);

console.log("=== DONE ===");
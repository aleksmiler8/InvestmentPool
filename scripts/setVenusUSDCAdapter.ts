import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";
const ADAPTER = "0xAa81663FaB0Bd93463B6076E428A6EA3e0d3b587";

// Asset.USDC = 1
// Protocol.Venus = 3
const USDC = 1;
const VENUS = 3;

console.log("=== SET VENUS USDC ADAPTER ===");

const [signer] = await ethers.getSigners();

console.log("Signer:", signer.address);
console.log("Pool:", POOL);
console.log("Adapter:", ADAPTER);

const Pool = await ethers.getContractAt("InvestmentPoolV2", POOL);

const tx = await Pool.setAssetAdapter(
    USDC,
    VENUS,
    ADAPTER
);

console.log("Transaction:", tx.hash);

const receipt = await tx.wait();

console.log("Confirmed in block:", receipt?.blockNumber);

const currentAdapter = await Pool.assetAdapters(USDC, VENUS);

console.log("USDC/Venus adapter:", currentAdapter);

console.log("=== DONE ===");
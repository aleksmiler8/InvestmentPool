import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL =
  "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

const ADAPTER =
  "0x1DB31FD0F62c2a0bFA48b1538b56d5982219f1c8";

const pool = await ethers.getContractAt(
  "InvestmentPoolV2",
  POOL
);

// Asset.USDC = 1
// Protocol.DForce = 6
console.log("Setting USDC DForce adapter...");

const tx = await pool.setAssetAdapter(
  1,
  6,
  ADAPTER
);

console.log("Transaction:", tx.hash);

await tx.wait();

console.log("USDC DForce adapter set successfully.");

console.log(
  "Stored adapter:",
  await pool.assetAdapters(1, 6)
);
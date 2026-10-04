import { network } from "hardhat";

const { ethers } = await network.connect();

const ADAPTER =
  "0x1DB31FD0F62c2a0bFA48b1538b56d5982219f1c8";

const adapter = await ethers.getContractAt(
  "DForceUSDCAdapter",
  ADAPTER
);

console.log("=== CHECK DFORCE USDC ADAPTER ===");

console.log("Adapter:", ADAPTER);

console.log("Pool:", await adapter.pool());

console.log("USDC:", await adapter.usdc());

console.log("iUSDC:", await adapter.iUSDC());

console.log(
  "Total assets:",
  (await adapter.totalAssets()).toString()
);
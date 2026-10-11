import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  const AAVE_POOL = "0x6807dc923806fE8Fd134338EABCA509979a7e0cB";
  const AUSDC = "0x00901a076785e0906d1028c7d6372d247bec7d61";
  const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  console.log("Deploying AaveUSDCAdapter...");

  const Adapter = await ethers.getContractFactory("AaveUSDCAdapter");
  const adapter = await Adapter.deploy(USDC, AAVE_POOL, AUSDC, POOL);

  await adapter.waitForDeployment();

  const address = await adapter.getAddress();
  console.log("AaveUSDCAdapter:", address);

  console.log("getTokens:", await adapter.getTokens());
  console.log("totalAssets:", await adapter.totalAssets());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
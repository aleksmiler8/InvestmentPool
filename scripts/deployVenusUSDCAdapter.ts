import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
  const VUSDC = "0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8";
  const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const Adapter = await ethers.getContractFactory("VenusUSDCAdapter");
  const adapter = await Adapter.deploy(USDC, VUSDC, POOL);

  await adapter.waitForDeployment();

  console.log("VenusUSDCAdapter:", await adapter.getAddress());
  console.log("getTokens:", await adapter.getTokens());
  console.log("totalAssets:", await adapter.totalAssets());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
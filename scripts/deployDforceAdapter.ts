import { network } from "hardhat";

const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";
const USDT = "0x55d398326f99059fF775485246999027B3197955";
const IUSDT = "0x0BF8C72d618B5d46b055165e21d661400008fa0F";

async function main() {
  const { ethers } = await network.connect();

  const Adapter = await ethers.getContractFactory("DForceAdapter");
  const adapter = await Adapter.deploy(USDT, IUSDT, POOL);

  await adapter.waitForDeployment();

  console.log("Network:", (await ethers.provider.getNetwork()).chainId.toString());
  console.log("New DForce USDT adapter:", await adapter.getAddress());
  console.log("Pool:", await adapter.pool());
  console.log("USDT:", await adapter.usdt());
  console.log("iUSDT:", await adapter.iUSDT());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
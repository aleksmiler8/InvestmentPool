import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL =
  "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

const USDC =
  "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

const Adapter =
  await ethers.getContractFactory("DForceUSDCAdapter");

console.log("Deploying DForceUSDCAdapter...");

const adapter = await Adapter.deploy(
  POOL,
  USDC
);

await adapter.waitForDeployment();

const address =
  await adapter.getAddress();

console.log(
  "DForceUSDCAdapter:",
  address
);

console.log(
  "Pool:",
  await adapter.pool()
);

console.log(
  "USDC:",
  await adapter.usdc()
);

console.log(
  "iUSDC:",
  await adapter.iUSDC()
);
import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;

  const proxyAddress =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const Pool = await ethers.getContractFactory("InvestmentPoolV2");

  const upgradesApi = await upgrades(hre, connection);

  console.log("Checking upgrade safety...");
  console.log("Proxy:", proxyAddress);

  await upgradesApi.validateUpgrade(
    proxyAddress,
    Pool
  );

  console.log("Upgrade validation PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
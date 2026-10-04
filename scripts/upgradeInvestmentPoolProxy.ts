import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;

  const upgradesApi = await upgrades(hre, connection);

  const proxyAddress =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  console.log("=== UPGRADING EXISTING INVESTMENT POOL ===");
  console.log("Proxy:", proxyAddress);

  const Pool = await ethers.getContractFactory(
    "InvestmentPoolV2"
  );

  console.log("Validating upgrade...");

  await upgradesApi.validateUpgrade(
    proxyAddress,
    Pool
  );

  console.log("Upgrade validation PASSED");

  console.log("Sending upgrade transaction...");

  const upgradedPool = await upgradesApi.upgradeProxy(
    proxyAddress,
    Pool,
    {
      kind: "transparent",
    }
  );

  await upgradedPool.waitForDeployment();

  const implementation =
    await upgradesApi.erc1967.getImplementationAddress(
      proxyAddress
    );

  console.log("");
  console.log("=== UPGRADE SUCCESSFUL ===");
  console.log("Proxy:", proxyAddress);
  console.log("New Implementation:", implementation);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
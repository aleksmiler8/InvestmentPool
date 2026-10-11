
import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
  const connection = await hre.network.create();
  const ethers = connection.ethers;

  const proxyAddress =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const Pool = await ethers.getContractFactory(
    "InvestmentPoolV2"
  );

  const upgradesApi = await upgrades(hre, connection);

  console.log("=== UPGRADE SAFETY CHECK ===");
  console.log("Network:", hre.network.name);
  console.log("Proxy:", proxyAddress);

  const currentImplementation =
    await upgradesApi.erc1967.getImplementationAddress(
      proxyAddress
    );

  console.log("Current implementation:", currentImplementation);
  console.log("Validating storage layout and upgrade compatibility...");

  await upgradesApi.validateUpgrade(
    proxyAddress,
    Pool,
    { kind: "transparent" }
  );

  console.log("UPGRADE VALIDATION PASSED");
  console.log("No transactions sent.");
}

main().catch((error) => {
  console.error("UPGRADE VALIDATION FAILED");
  console.error(error);
  process.exitCode = 1;
});

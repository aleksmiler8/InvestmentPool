import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const aaveAddress =
  "0x85b4a66E039E7d182D5A7206E436341B5e1966a9";

  const dforceAddress =
    "0xa18E0e1dc54E86F9164c8b149a2587Ea7508deAa";

  console.log("========================================");
  console.log("       EXISTING ADAPTERS CHECK");
  console.log("========================================");

  console.log();
  console.log("=== AAVE ===");

  const aave = await connection.ethers.getContractAt(
    "AaveAdapter",
    aaveAddress
  );

  console.log("Address:", aaveAddress);
  console.log("Pool:", await aave.pool());
  console.log("USDT:", await aave.usdt());

  console.log(
    "Total assets:",
    connection.ethers.formatUnits(
      await aave.totalAssets(),
      18
    ),
    "USDT"
  );

  console.log();
  console.log("=== DFORCE ===");

  const dforce = await connection.ethers.getContractAt(
    "DForceAdapter",
    dforceAddress
  );

  console.log("Address:", dforceAddress);
  console.log("Pool:", await dforce.pool());
  console.log("USDT:", await dforce.usdt());
  console.log("iUSDT:", await dforce.iUSDT());

  console.log(
    "Total assets:",
    connection.ethers.formatUnits(
      await dforce.totalAssets(),
      18
    ),
    "USDT"
  );

  console.log();
  console.log("========================================");
  console.log("READ ONLY — NO TRANSACTION");
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
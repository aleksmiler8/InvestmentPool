import hre from "hardhat";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;

  const proxyAddress =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const pool = await ethers.getContractAt(
    "InvestmentPoolV2",
    proxyAddress
  );

  console.log("=== MIGRATING LEGACY USDT STATE ===");
  console.log("Proxy:", proxyAddress);

  const tx = await pool.migrateLegacyUSDTState();

  console.log("Transaction:", tx.hash);

  await tx.wait();

  console.log("=== MIGRATION SUCCESSFUL ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
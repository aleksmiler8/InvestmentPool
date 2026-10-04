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

  console.log("=== USDC CHECK ===");
  console.log("Proxy:", proxyAddress);

  const usdcAddress = await pool.usdc();

  console.log("USDC address:", usdcAddress);

  console.log("\n=== ACCOUNTING ===");

  console.log(
    "USDC totalDeposits:",
    ethers.formatUnits(
      await pool.totalDepositsByAsset(1),
      6
    )
  );

  console.log(
    "USDC totalActiveDeposits:",
    ethers.formatUnits(
      await pool.totalActiveDepositsByAsset(1),
      6
    )
  );

  console.log("\n=== USDC ADAPTERS ===");

  const protocols = [
    "Beefy",
    "Pancake",
    "Aave",
    "DForce",
  ];

  for (const protocol of protocols) {
    const protocolId = {
      Beefy: 2,
      Pancake: 4,
      Aave: 5,
      DForce: 6,
    }[protocol];

    const adapter = await pool.assetAdapters(
      1,
      protocolId
    );

    console.log(`${protocol}: ${adapter}`);
  }

  console.log("\n=== USDT CHECK ===");

  console.log(
    "USDT totalDeposits:",
    ethers.formatUnits(
      await pool.totalDepositsByAsset(0),
      18
    )
  );

  console.log(
    "USDT totalActiveDeposits:",
    ethers.formatUnits(
      await pool.totalActiveDepositsByAsset(0),
      18
    )
  );

  console.log("\n=== DONE ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
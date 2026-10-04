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

  console.log("=== CHECK NEW MULTI-ASSET STORAGE ===");

  console.log(
    "USDT totalDepositsByAsset:",
    ethers.formatUnits(
      await pool.totalDepositsByAsset(0),
      18
    )
  );

  console.log(
    "USDT totalActiveDepositsByAsset:",
    ethers.formatUnits(
      await pool.totalActiveDepositsByAsset(0),
      18
    )
  );

  console.log(
    "USDC totalDepositsByAsset:",
    ethers.formatUnits(
      await pool.totalDepositsByAsset(1),
      6
    )
  );

  console.log(
    "USDC totalActiveDepositsByAsset:",
    ethers.formatUnits(
      await pool.totalActiveDepositsByAsset(1),
      6
    )
  );

  console.log("=== DONE ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
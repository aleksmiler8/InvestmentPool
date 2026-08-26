import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const poolAddress =
    "0x8A89567a6863f8dd7cA2Cb235022c00cd95F40c0";

  const pool =
    await connection.ethers.getContractAt(
      "InvestmentPoolV2",
      poolAddress
    );

  console.log("=== NEW POOL AAVE + DFORCE READY CHECK ===");
  console.log("POOL:", poolAddress);

  console.log();
  console.log("=== BASIC ===");

  console.log(
    "OWNER:",
    await pool.owner()
  );

  console.log(
    "USDT:",
    await pool.usdt()
  );

  console.log(
    "RESERVE WALLET:",
    await pool.reserveWallet()
  );

  console.log(
    "PAUSED:",
    await pool.paused()
  );

  console.log(
    "MINIMUM INVESTMENT:",
    await pool.minimumInvestment()
  );

  console.log();
  console.log("=== ADAPTERS ===");

  const aaveAdapter =
    await pool.aaveAdapter();

  const dforceAdapter =
    await pool.dforceAdapter();

  console.log(
    "AAVE ADAPTER:",
    aaveAdapter
  );

  console.log(
    "DFORCE ADAPTER:",
    dforceAdapter
  );

  console.log();
  console.log("=== PROTOCOL BALANCES ===");

  const aaveBalance =
    await pool.protocolBalance(5);

  const dforceBalance =
    await pool.protocolBalance(6);

  console.log(
    "AAVE BALANCE:",
    connection.ethers.formatUnits(
      aaveBalance,
      18
    ),
    "USDT"
  );

  console.log(
    "DFORCE BALANCE:",
    connection.ethers.formatUnits(
      dforceBalance,
      18
    ),
    "USDT"
  );

  console.log();
  console.log("=== AAVE ADAPTER ===");

  const aave =
    await connection.ethers.getContractAt(
      "AaveAdapter",
      aaveAdapter
    );

  console.log(
    "AAVE POOL:",
    await aave.pool()
  );

  console.log(
    "AAVE USDT:",
    await aave.usdt()
  );

  console.log(
    "AAVE TOTAL ASSETS:",
    connection.ethers.formatUnits(
      await aave.totalAssets(),
      18
    ),
    "USDT"
  );

  console.log();
  console.log("=== DFORCE ADAPTER ===");

  const dforce =
    await connection.ethers.getContractAt(
      "DForceAdapter",
      dforceAdapter
    );

  console.log(
    "DFORCE POOL:",
    await dforce.pool()
  );

  console.log(
    "DFORCE USDT:",
    await dforce.usdt()
  );

  console.log(
    "DFORCE iUSDT:",
    await dforce.iUSDT()
  );

  console.log(
    "DFORCE TOTAL ASSETS:",
    connection.ethers.formatUnits(
      await dforce.totalAssets(),
      18
    ),
    "USDT"
  );

  console.log();
  console.log("=== READ ONLY ===");
  console.log("NO TRANSACTION SENT");
  console.log("NO FUNDS MOVED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
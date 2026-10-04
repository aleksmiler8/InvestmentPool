import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const POOL =
    "0x53fC4c8F3901aD94351b4fe8Ce93335C38f438F1";

  const USDT =
    "0x55d398326f99059fF775485246999027B3197955";

  const OWNER =
    "0x0c74c7e450Aff617208d022D023b0aCA66c69994";

  const pool = await connection.ethers.getContractAt(
    "InvestmentPoolV2",
    POOL
  );

  const usdt = await connection.ethers.getContractAt(
    "IERC20",
    USDT
  );

  console.log("=== POOL TEST READY CHECK ===");

  console.log(
    "MINIMUM INVESTMENT:",
    await pool.minimumInvestment()
  );

  console.log(
    "OWNER USDT:",
    await usdt.balanceOf(OWNER)
  );

  console.log(
    "OWNER:",
    await pool.owner()
  );

  console.log("DAY:", 86400);

  console.log("=== CHECK COMPLETE ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
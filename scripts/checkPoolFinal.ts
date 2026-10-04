import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const PROXY =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const pool = await connection.ethers.getContractAt(
    "InvestmentPoolV2",
    PROXY
  );

  console.log("========================================");
  console.log("        FINAL POOL CONFIG CHECK");
  console.log("========================================");

  console.log("Proxy:", PROXY);
  console.log("----------------------------------------");

  console.log("Owner:", await pool.owner());
  console.log("USDT:", await pool.usdt());
  console.log("Reserve:", await pool.reserveWallet());

  console.log("----------------------------------------");

  console.log(
    "Minimum investment:",
    await pool.minimumInvestment()
  );

  console.log(
    "Early withdraw fee:",
    await pool.earlyWithdrawFee()
  );

  console.log("----------------------------------------");

  console.log("Aave:", await pool.aaveAdapter());
  console.log("DForce:", await pool.dforceAdapter());
  console.log("Venus adapter:", await pool.venusAdapter());
  console.log("Venus token:", await pool.venusToken());

  console.log("----------------------------------------");

  console.log("DAY reward:", await pool.rewardRate(86400));
  console.log("WEEK reward:", await pool.rewardRate(604800));
  console.log("MONTH reward:", await pool.rewardRate(2592000));
  console.log("3 MONTH reward:", await pool.rewardRate(7776000));
  console.log("6 MONTH reward:", await pool.rewardRate(15552000));
  console.log("YEAR reward:", await pool.rewardRate(31536000));

  console.log("========================================");
  console.log("READ ONLY — NO TRANSACTION");
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
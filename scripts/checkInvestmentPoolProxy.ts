import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const PROXY =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const expectedUSDT =
    "0x55d398326f99059fF775485246999027B3197955";

  const expectedReserve =
    "0x14899b93D51C6F6339F3159485bAb2557529DF10";

  const pool = await connection.ethers.getContractAt(
    "InvestmentPoolV2",
    PROXY
  );

  console.log("========================================");
  console.log("      INVESTMENT POOL PROXY CHECK");
  console.log("========================================");

  console.log("Proxy:", PROXY);

  const owner = await pool.owner();
  console.log("Owner:", owner);

  const usdt = await pool.usdt();
  console.log("USDT:", usdt);

  const reserve = await pool.reserveWallet();
  console.log("Reserve:", reserve);

  const minimumInvestment =
    await pool.minimumInvestment();

  console.log(
    "Minimum investment:",
    connection.ethers.formatUnits(
      minimumInvestment,
      18
    ),
    "USDT"
  );

  const earlyWithdrawFee =
    await pool.earlyWithdrawFee();

  console.log(
    "Early withdrawal fee:",
    earlyWithdrawFee.toString(),
    "basis points"
  );

  console.log("----------------------------------------");

  console.log(
    "DAY reward:",
    (await pool.rewardRate(86400)).toString()
  );

  console.log(
    "WEEK reward:",
    (await pool.rewardRate(604800)).toString()
  );

  console.log(
    "MONTH reward:",
    (await pool.rewardRate(2592000)).toString()
  );

  console.log(
    "3 MONTH reward:",
    (await pool.rewardRate(7776000)).toString()
  );

  console.log(
    "6 MONTH reward:",
    (await pool.rewardRate(15552000)).toString()
  );

  console.log(
    "YEAR reward:",
    (await pool.rewardRate(31536000)).toString()
  );

  console.log("----------------------------------------");

  console.log(
    "USDT correct:",
    usdt.toLowerCase() === expectedUSDT.toLowerCase()
  );

  console.log(
    "Reserve correct:",
    reserve.toLowerCase() === expectedReserve.toLowerCase()
  );

  console.log(
    "Minimum = 25 USDT:",
    minimumInvestment === connection.ethers.parseUnits("25", 18)
  );

  console.log(
    "Fee = 15%:",
    earlyWithdrawFee === 1500n
  );

  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
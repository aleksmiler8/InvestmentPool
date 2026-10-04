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
  console.log("           VENUS CHECK");
  console.log("========================================");

  console.log("Proxy:", PROXY);
  console.log("----------------------------------------");

  console.log("Venus adapter:", await pool.venusAdapter());
  console.log("Venus token:", await pool.venusToken());

  console.log("----------------------------------------");
  console.log("VUSDT constant:", await pool.VUSDT());

  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
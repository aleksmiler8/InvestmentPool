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
  console.log("      INVESTMENT POOL ADAPTER CHECK");
  console.log("========================================");
  console.log("Proxy:", PROXY);
  console.log("----------------------------------------");

  const beefy = await pool.beefyAdapter();
  const venus = await pool.venusAdapter();
  const pancake = await pool.pancakeAdapter();
  const aave = await pool.aaveAdapter();
  const dforce = await pool.dforceAdapter();

  console.log("Beefy:   ", beefy);
  console.log("Venus:   ", venus);
  console.log("Pancake: ", pancake);
  console.log("Aave:    ", aave);
  console.log("DForce:  ", dforce);

  console.log("----------------------------------------");

  console.log(
    "Beefy connected:",
    beefy !== "0x0000000000000000000000000000000000000000"
  );

  console.log(
    "Venus connected:",
    venus !== "0x0000000000000000000000000000000000000000"
  );

  console.log(
    "Pancake connected:",
    pancake !== "0x0000000000000000000000000000000000000000"
  );

  console.log(
    "Aave connected:",
    aave !== "0x0000000000000000000000000000000000000000"
  );

  console.log(
    "DForce connected:",
    dforce !== "0x0000000000000000000000000000000000000000"
  );

  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const poolAddress =
  "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

const aaveAdapter =
  "0x85b4a66E039E7d182D5A7206E436341B5e1966a9";

const dforceAdapter =
  "0xa18E0e1dc54E86F9164c8b149a2587Ea7508deAa";

  const pool =
    await connection.ethers.getContractAt(
      "InvestmentPoolV2",
      poolAddress
    );

  console.log("=== SET NEW POOL ADAPTERS ===");
  console.log("POOL:", poolAddress);
  console.log("AAVE:", aaveAdapter);
  console.log("DFORCE:", dforceAdapter);

  console.log();
  console.log("SETTING AAVE...");

  const txAave =
    await pool.setProtocolAdapter(
      5,
      aaveAdapter
    );

  console.log("AAVE TX:", txAave.hash);
  await txAave.wait();

  console.log("AAVE CONFIRMED");

  console.log();
  console.log("SETTING DFORCE...");

  const txDforce =
    await pool.setProtocolAdapter(
      6,
      dforceAdapter
    );

  console.log("DFORCE TX:", txDforce.hash);
  await txDforce.wait();

  console.log("DFORCE CONFIRMED");


  console.log();
  console.log("=== READ ONLY CHECK ===");

  console.log(
    "POOL:",
    await pool.getAddress()
  );

  console.log(
    "AAVE ADAPTER:",
    await pool.aaveAdapter()
  );

  console.log(
    "DFORCE ADAPTER:",
    await pool.dforceAdapter()
  );

  console.log();
  console.log("DONE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

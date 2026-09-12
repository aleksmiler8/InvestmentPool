import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const poolAddress =
     "0xaA1B6eb5Ade263A387B0F33e4d11Bbd1c2362215";

  const aaveAdapter =
     "0xE89012A0ecf4887Dc6e2F8B588E776d127FaCC4b";

  const dforceAdapter =
    "0x212fD8D805387A5a739d54e1b9B5424E281E74Ab";

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
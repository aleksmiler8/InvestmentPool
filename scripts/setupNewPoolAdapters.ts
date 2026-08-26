import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const poolAddress =
    "0x8A89567a6863f8dd7cA2Cb235022c00cd95F40c0";

  const aaveAdapter =
    "0xa05aF259800e419B12Fa2fD8AEb8A12279f8F8C7";

  const dforceAdapter =
    "0x68a522913D769A62730292dB75F25fAc399023ed";

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
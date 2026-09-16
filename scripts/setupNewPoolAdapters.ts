import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const poolAddress =
     "0x53fC4c8F3901aD94351b4fe8Ce93335C38f438F1";

  const aaveAdapter =
     "0xe1b5288f52b5Ee0fF645671C811FA03a50B5CC90";

  const dforceAdapter =
    "0xc7A1C9435b42c0D6B962ef17F89B43d4E5245347";

    const uniswapV3Adapter =
  "0x0355a10a6Cf2af3723cC36840cd884fdAfB5DA51";

  const pool =
    await connection.ethers.getContractAt(
      "InvestmentPoolV2",
      poolAddress
    );

  console.log("=== SET NEW POOL ADAPTERS ===");
  console.log("POOL:", poolAddress);
  console.log("AAVE:", aaveAdapter);
  console.log("DFORCE:", dforceAdapter);
  console.log("UNISWAP V3:", uniswapV3Adapter);

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
  console.log("SETTING UNISWAP V3...");

  const txUniswap =
    await pool.setProtocolAdapter(
      7,
      uniswapV3Adapter
    );

  console.log("UNISWAP V3 TX:", txUniswap.hash);
  await txUniswap.wait();

  console.log("UNISWAP V3 CONFIRMED");

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

    console.log(
    "UNISWAP V3 ADAPTER:",
    await pool.uniswapV3Adapter()
  );

  console.log();
  console.log("DONE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const POOL =
    "0x53fC4c8F3901aD94351b4fe8Ce93335C38f438F1";

  const pool = await connection.ethers.getContractAt(
    "InvestmentPoolV2",
    POOL
  );

  const latestBlock =
    await connection.ethers.provider.getBlockNumber();

  const step = 100;

  console.log("LATEST BLOCK:", latestBlock);

  for (
    let fromBlock = latestBlock - 5000;
    fromBlock <= latestBlock;
    fromBlock += step
  ) {
    const toBlock = Math.min(
      fromBlock + step - 1,
      latestBlock
    );

    console.log(
      `Checking blocks ${fromBlock} -> ${toBlock}`
    );

    const events = await pool.queryFilter(
      pool.filters.LiquidityInvested(),
      fromBlock,
      toBlock
    );

    for (const event of events) {
      console.log();
      console.log("=== LIQUIDITY INVESTED ===");
      console.log("BLOCK:", event.blockNumber);
      console.log("TX:", event.transactionHash);

      if ("args" in event && event.args) {
        console.log(
          "PROTOCOL:",
          event.args[0].toString()
        );

        console.log(
          "AMOUNT:",
          event.args[1].toString()
        );
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
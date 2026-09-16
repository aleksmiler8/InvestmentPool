import { network } from "hardhat";

const POOL =
  "0x53fC4c8F3901aD94351b4fe8Ce93335C38f438F1";

async function main() {
  const connection = await network.connect();

  console.log("=== DEPLOY UNISWAP V3 ETH/USDT ADAPTER ===");
  console.log("POOL:", POOL);
  console.log(
    "USDT:",
    "0x55d398326f99059fF775485246999027B3197955"
  );
  console.log(
    "WETH/ETH:",
    "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"
  );
  console.log(
    "UNISWAP V3 POOL:",
    "0xF9878A5dD55EdC120Fde01893ea713a4f032229c"
  );

  const Adapter =
    await connection.ethers.getContractFactory(
      "UniswapV3ETHUSDTAdapter"
    );

  const adapter =
    await Adapter.deploy(POOL);

  await adapter.waitForDeployment();

  const address =
    await adapter.getAddress();

  console.log();
  console.log(
    "UNISWAP V3 ADAPTER DEPLOYED:",
    address
  );

  console.log();
  console.log("=== READ ONLY CHECK ===");

  console.log(
    "POOL:",
    await adapter.pool()
  );

  console.log(
    "USDT:",
    await adapter.usdt()
  );

  console.log(
    "WETH:",
    await adapter.WETH()
  );

  console.log(
    "UNISWAP V3 POOL:",
    await adapter.UNISWAP_V3_POOL()
  );

  console.log(
    "POOL FEE:",
    await adapter.POOL_FEE()
  );

  console.log(
    "POSITION TOKEN ID:",
    await adapter.positionTokenId()
  );

  console.log(
    "TOTAL ASSETS:",
    await adapter.totalAssets()
  );

  console.log();
  console.log("=== IMPORTANT ===");
  console.log("POOL CONNECTION WAS NOT CHANGED");
  console.log("NO USDT WAS DEPOSITED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

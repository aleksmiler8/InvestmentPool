import { network } from "hardhat";

const POOL =
  "0x8A89567a6863f8dd7cA2Cb235022c00cd95F40c0";

const USDT =
  "0x55d398326f99059fF775485246999027B3197955";

async function main() {
  const connection = await network.connect();

  console.log("=== DEPLOY DFORCE ADAPTER ===");
  console.log("POOL:", POOL);
  console.log("USDT:", USDT);
  console.log(
    "iUSDT:",
    "0x0BF8C72d618B5d46b055165e21d661400008fa0F"
  );

  const Adapter =
    await connection.ethers.getContractFactory(
      "DForceAdapter"
    );

  const adapter = await Adapter.deploy(
    USDT,
    "0x0BF8C72d618B5d46b055165e21d661400008fa0F",
    POOL
);

  await adapter.waitForDeployment();

  const address =
    await adapter.getAddress();

  console.log();
  console.log(
    "DFORCE ADAPTER DEPLOYED:",
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
    "iUSDT:",
    await adapter.iUSDT()
  );

  console.log(
    "TOTAL ASSETS:",
    await adapter.totalAssets()
  );

  console.log();
  console.log("NO POOL CONNECTION CHANGED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

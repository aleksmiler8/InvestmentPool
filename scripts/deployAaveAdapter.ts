import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const poolAddress =
   "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const usdtAddress =
    "0x55d398326f99059fF775485246999027B3197955";

  console.log("Deploying AaveAdapter...");
  console.log("POOL:", poolAddress);
  console.log("USDT:", usdtAddress);

  const Adapter =
    await connection.ethers.getContractFactory(
      "AaveAdapter"
    );

  const adapter =
    await Adapter.deploy(
      poolAddress,
      usdtAddress
    );

  await adapter.waitForDeployment();

  console.log(
    "AaveAdapter deployed to:",
    await adapter.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

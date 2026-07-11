import { network } from "hardhat";

async function main() {
  console.log("Deploying InvestmentPoolV2");

  const connection = await network.connect();

  const Pool = await connection.ethers.getContractFactory("InvestmentPoolV2");
  
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";

  const pool = await Pool.deploy(usdtAddress);

  await pool.waitForDeployment();

  console.log(
    "InvestmentPool deployed to:",
    await pool.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
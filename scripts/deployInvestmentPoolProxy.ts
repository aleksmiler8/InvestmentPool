import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
  console.log("Deploying InvestmentPoolV2 implementation + proxy");

  const connection = await hre.network.create();
  const { ethers } = connection;

  const upgradesApi = await upgrades(hre, connection);

  const Pool = await ethers.getContractFactory("InvestmentPoolV2");

  const usdtAddress =
    "0x55d398326f99059fF775485246999027B3197955";

  const reserveAddress =
    "0x14899b93D51C6F6339F3159485bAb2557529DF10";

  console.log("USDT:", usdtAddress);
  console.log("Reserve:", reserveAddress);

  const pool = await upgradesApi.deployProxy(
    Pool,
    [usdtAddress, reserveAddress],
    {
      initializer: "initialize",
    }
  );

  await pool.waitForDeployment();

  const proxyAddress = await pool.getAddress();

  console.log(
    "InvestmentPool Proxy deployed to:",
    proxyAddress
  );

  console.log(
    "Implementation:",
    await upgradesApi.erc1967.getImplementationAddress(
      proxyAddress
    )
  );

  console.log(
    "Admin:",
    await upgradesApi.erc1967.getAdminAddress(
      proxyAddress
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
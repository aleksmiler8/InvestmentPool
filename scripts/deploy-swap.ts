import { network } from "hardhat";

async function main() {
  console.log("Deploying InvestmentPoolSwap");

  const connection = await network.connect();

  const Swap = await connection.ethers.getContractFactory("InvestmentPoolSwap");

  // PancakeSwap V2 Router (BNB Mainnet)
  const routerAddress = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

  // USDT (BNB Mainnet)
  const usdtAddress = "0x55d398326f99059fF775485246999027B3197955";

  // Кошелёк для получения комиссии
  const reserveAddress = "0x14899b93D51C6F6339F3159485bAb2557529DF10";

  // Владелец контракта
  const ownerAddress = "0x0c74c7e450Aff617208d022D023b0aCA66c69994";

  const swap = await Swap.deploy(
    routerAddress,
    usdtAddress,
    reserveAddress,
    ownerAddress
  );

  await swap.waitForDeployment();

  console.log(
    "InvestmentPoolSwap deployed to:",
    await swap.getAddress()
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
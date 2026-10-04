import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const USDT =
    "0x55d398326f99059fF775485246999027B3197955";

  const POOL =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07"

  const ADAPTER =
    "0xEC73a233A4Cd42Be59926E5a2A4c9E49B00Db8ed";

  const usdt = await connection.ethers.getContractAt(
    "IERC20",
    USDT
  );

  console.log("========================================");
  console.log("        CURRENT BALANCES");
  console.log("========================================");

  // 1. Обычный USDT на Pool
  const poolBalance = await usdt.balanceOf(POOL);

  console.log(
    "POOL USDT:",
    connection.ethers.formatUnits(poolBalance, 18)
  );

  // 2. Обычный USDT на Adapter
  const adapterBalance = await usdt.balanceOf(ADAPTER);

  console.log(
    "ADAPTER USDT:",
    connection.ethers.formatUnits(adapterBalance, 18)
  );

  console.log("----------------------------------------");

  // ABI DForce Adapter
  const adapter = await connection.ethers.getContractAt(
    [
      "function totalAssets() view returns (uint256)",
      "function pool() view returns (address)",
      "function usdt() view returns (address)"
    ],
    ADAPTER
  );

  // 3. Total assets адаптера
  const totalAssets = await adapter.totalAssets();

  console.log(
    "ADAPTER totalAssets:",
    connection.ethers.formatUnits(totalAssets, 18)
  );

  console.log("----------------------------------------");

  // 4. Получаем адрес iUSDT из адаптера
  const iUSDTAddress = await adapter.usdt();

  console.log("ADAPTER usdt():", iUSDTAddress);

  console.log("----------------------------------------");

  // 5. Проверяем iUSDT
  const iUSDT = await connection.ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function exchangeRateStored() view returns (uint256)"
    ],
    iUSDTAddress
  );

  const iUSDTBalance = await iUSDT.balanceOf(ADAPTER);

  console.log(
    "ADAPTER iUSDT:",
    connection.ethers.formatUnits(iUSDTBalance, 18)
  );

  // 6. Exchange rate
  const exchangeRate = await iUSDT.exchangeRateStored();

  console.log(
    "iUSDT exchangeRateStored:",
    connection.ethers.formatUnits(exchangeRate, 18)
  );

  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
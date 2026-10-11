import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
  const PROXY_ADDRESS = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07"

  // 1. Создаём подключение к сети (обязательно в Hardhat 3)
  const connection = await hre.network.create({ network: "bsc" });

  // 2. Получаем ethers ИЗ подключения, а не из hre
  const { ethers } = connection;

  // 3. Создаём API для upgrades, передавая hre и connection
  const upgradesApi = await upgrades(hre, connection);

  // 4. Получаем фабрику контракта
  const InvestmentPoolV2 = await ethers.getContractFactory("InvestmentPoolV2");

  console.log("Валидация апгрейда...");

  // 5. Запускаем проверку
  await upgradesApi.validateUpgrade(PROXY_ADDRESS, InvestmentPoolV2, {
    kind: "transparent", // или "transparent", в зависимости от вашего прокси
  });

  console.log("✅ Апгрейд безопасен, storage layout совместим");
}

main().catch((e) => {
  console.error("❌ Ошибка валидации:", e);
  process.exit(1);
});
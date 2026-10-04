import hre from "hardhat";

async function main() {
  const { ethers } = await hre.network.connect();

  const ADAPTER = "0x465bBeF6829016507d966514Ab897B868ada56f6";
  const IUSDT = "0x0BF8C72d618B5d46b055165e21d661400008fa0F";

  const adapter = await ethers.getContractAt(
    [
      "function totalAssets() external view returns (uint256)",
      "function usdt() external view returns (address)",
      "function iUSDT() external view returns (address)",
      "function pool() external view returns (address)"
    ],
    ADAPTER
  );

  const usdt = await ethers.getContractAt(
    [
      "function balanceOf(address) external view returns (uint256)"
    ],
    await adapter.usdt()
  );

  const iusdt = await ethers.getContractAt(
    [
      "function balanceOf(address) external view returns (uint256)",
      "function exchangeRateStored() external view returns (uint256)"
    ],
    IUSDT
  );

  const usdtBalance = await usdt.balanceOf(ADAPTER);
  const iusdtBalance = await iusdt.balanceOf(ADAPTER);
  const exchangeRate = await iusdt.exchangeRateStored();
  const totalAssets = await adapter.totalAssets();

  const underlying =
    (iusdtBalance * exchangeRate) / 10n ** 18n;

  console.log("=== DFORCE ADAPTER REAL CHECK ===");
  console.log("ADAPTER:", ADAPTER);
  console.log("POOL:", await adapter.pool());
  console.log("USDT:", await adapter.usdt());
  console.log("iUSDT:", await adapter.iUSDT());

  console.log("");
  console.log("USDT BALANCE:", ethers.formatUnits(usdtBalance, 18));
  console.log("iUSDT BALANCE:", ethers.formatUnits(iusdtBalance, 8));
  console.log("EXCHANGE RATE:", exchangeRate.toString());
  console.log(
    "iUSDT UNDERLYING:",
    ethers.formatUnits(underlying, 18)
  );
  console.log(
    "TOTAL ASSETS:",
    ethers.formatUnits(totalAssets, 18)
  );

  console.log("");
  console.log("READ ONLY");
  console.log("NO TRANSACTION SENT");
  console.log("NO FUNDS MOVED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
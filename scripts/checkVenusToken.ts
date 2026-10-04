import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const PROXY =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const VUSDT =
    "0xfD5840Cd36d94D7229439859C0112a4185BC0255";

  const pool = await connection.ethers.getContractAt(
    "InvestmentPoolV2",
    PROXY
  );

  const vusdt = await connection.ethers.getContractAt(
    [
      "function balanceOf(address) view returns (uint256)",
      "function exchangeRateStored() view returns (uint256)",
      "function balanceOfUnderlying(address) returns (uint256)",
    ],
    VUSDT
  );

  console.log("========================================");
  console.log("          VENUS TOKEN CHECK");
  console.log("========================================");

  console.log("Pool:", PROXY);
  console.log("VUSDT:", VUSDT);
  console.log("----------------------------------------");

  console.log(
    "Pool venusToken:",
    await pool.venusToken()
  );

  console.log(
    "vUSDT balance of Pool:",
    await vusdt.balanceOf(PROXY)
  );

  console.log(
    "vUSDT exchange rate:",
    await vusdt.exchangeRateStored()
  );

  const underlying = await vusdt.balanceOfUnderlying.staticCall(PROXY);

console.log(
  "vUSDT underlying of Pool:",
  underlying
);

  console.log("========================================");
  console.log("READ ONLY — NO TRANSACTION");
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
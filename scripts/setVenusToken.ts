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

  console.log("========================================");
  console.log("        SET VENUS TOKEN");
  console.log("========================================");
  console.log("Proxy:", PROXY);
  console.log("VUSDT:", VUSDT);
  console.log("----------------------------------------");

  console.log("Setting Venus token...");

  const tx = await pool.setVenusToken(VUSDT);

  console.log("TX:", tx.hash);

  await tx.wait();

  console.log("CONFIRMED");

  console.log("----------------------------------------");
  console.log("Venus token:", await pool.venusToken());
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
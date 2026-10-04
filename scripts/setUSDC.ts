import hre from "hardhat";

async function main() {
  const connection = await hre.network.create();
  const { ethers } = connection;

  const proxyAddress =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

  const usdcAddress =
    "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";

  const pool = await ethers.getContractAt(
    "InvestmentPoolV2",
    proxyAddress
  );

  console.log("=== SETTING USDC ===");
  console.log("Proxy:", proxyAddress);
  console.log("USDC:", usdcAddress);

  const tx = await pool.setUSDC(usdcAddress);

  console.log("Transaction:", tx.hash);

  await tx.wait();

  console.log("=== USDC SET SUCCESSFULLY ===");

  const currentUSDC = await pool.usdc();

  console.log("Current USDC:", currentUSDC);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
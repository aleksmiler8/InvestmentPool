import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const POOL =
    "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07"

  const OWNER =
    "0x0c74c7e450Aff617208d022D023b0aCA66c69994";

  const pool = await connection.ethers.getContractAt(
    "InvestmentPoolV2",
    POOL
  );

  const count = await pool.getInvestmentCount(OWNER);

  console.log("OWNER:", OWNER);
  console.log("INVESTMENT COUNT:", count.toString());

  for (let i = 0n; i < count; i++) {
    const inv = await pool.getInvestment(OWNER, i);

    console.log();
    console.log("INVESTMENT:", i.toString());
    console.log("AMOUNT:", inv[0].toString());
    console.log("PERIOD:", inv[3].toString());
    console.log("REWARD:", inv[4].toString());
    console.log("ACTIVE:", inv[5]);
    console.log("FINISHED:", inv[6]);

    const positionCount =
      await pool.getInvestmentPositionCount(OWNER, i);

    console.log(
      "POSITIONS:",
      positionCount.toString()
    );
    if (positionCount > 0n) {
  const position =
    await pool.getInvestmentPosition(OWNER, i, 0);

  console.log(
    "POSITION PROTOCOL:",
    position[0].toString()
  );

  console.log(
    "POSITION SHARES:",
    position[1].toString()
  );

  console.log(
    "POSITION PRINCIPAL:",
    position[2].toString()
  );

  console.log(
    "POSITION ACTIVE:",
    position[3]
  );
}
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
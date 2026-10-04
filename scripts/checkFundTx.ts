import { network } from "hardhat";

const { ethers } = await network.connect();

const USDT = "0x55d398326f99059fF775485246999027B3197955";
const TX_HASH = "0xebe580ed56378204d92db517615161ca3aa2ce852282288fd541b896980d0296";

const provider = ethers.provider;
const receipt = await provider.getTransactionReceipt(TX_HASH);

if (!receipt) {
  console.log("TRANSACTION NOT FOUND");
  process.exit(0);
}

console.log("STATUS:", receipt.status);
console.log("FROM:", receipt.from);
console.log("TO:", receipt.to);

const iface = new ethers.Interface([
  "event Transfer(address indexed from,address indexed to,uint256 value)"
]);

console.log("\nALL TRANSFERS:");

for (const log of receipt.logs) {
  if (log.topics[0] !== ethers.id("Transfer(address,address,uint256)")) continue;

  try {
    const parsed = iface.parseLog({
      topics: log.topics as string[],
      data: log.data
    });

    if (parsed) {
      console.log("TOKEN:", log.address);
      console.log("FROM:", parsed.args[0]);
      console.log("TO:", parsed.args[1]);
      console.log(
        "VALUE:",
        ethers.formatUnits(parsed.args[2], 18)
      );
      console.log("---");
    }
  } catch {}
}
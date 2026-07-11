import { network } from "hardhat";

async function main() {
  const connection = await network.connect();

  const Token = await connection.ethers.getContractFactory("MyToken");

  const token = await Token.deploy();

  await token.waitForDeployment();

  console.log("Token deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
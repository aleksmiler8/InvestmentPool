import { network } from "hardhat";

const { ethers } = await network.connect();

const USDC = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d";
const VUSDC = "0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8";
const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

console.log("=== DEPLOY VENUS USDC ADAPTER ===");
console.log("USDC:", USDC);
console.log("vUSDC:", VUSDC);
console.log("Pool:", POOL);

const Adapter = await ethers.getContractFactory("VenusUSDCAdapter");

const adapter = await Adapter.deploy(
    USDC,
    VUSDC,
    POOL
);

await adapter.waitForDeployment();

const adapterAddress = await adapter.getAddress();

console.log("");
console.log("VenusUSDCAdapter deployed:");
console.log(adapterAddress);

console.log("");
console.log("=== CHECK ===");

const tokens = await adapter.getTokens();

console.log("Underlying USDC:", tokens[0]);
console.log("vUSDC:", tokens[1]);
console.log("Pool:", tokens[2]);
import { network } from "hardhat";

const { ethers } = await network.connect();

const POOL = "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";
const ADAPTER = "0x932D40D68F6F29Ffc2fbcAd1B44d72D84C723F64";

// Asset.USDC = 1
// Protocol.Venus = 3
const USDC = 1;
const VENUS = 3;

console.log("=== CHECK VENUS USDC ADAPTER ===");

const [signer] = await ethers.getSigners();

console.log("Signer:", signer.address);
console.log("Pool:", POOL);
console.log("Adapter:", ADAPTER);

const Pool = await ethers.getContractAt("InvestmentPoolV2", POOL);

const owner = await Pool.owner();

console.log("Owner:", owner);
console.log("Signer is owner:", owner.toLowerCase() === signer.address.toLowerCase());

const currentAdapter = await Pool.assetAdapters(USDC, VENUS);

console.log("Current USDC/Venus adapter:", currentAdapter);

console.log("");
console.log("=== CHECK SETTER ===");

try {
    await Pool.setAssetAdapter.staticCall(
        USDC,
        VENUS,
        ADAPTER
    );

    console.log("setAssetAdapter() static call: OK");
} catch (error) {
    console.log("setAssetAdapter() static call: FAILED");
    console.log(error);
}
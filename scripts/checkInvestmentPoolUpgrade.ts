import hre from "hardhat";
import { upgrades } from "@openzeppelin/hardhat-upgrades";

async function main() {
    const connection = await hre.network.create();

    const upgradesApi = await upgrades(hre, connection);

    const Pool = await connection.ethers.getContractFactory(
        "InvestmentPoolV2"
    );

    const proxyAddress =
        "0x19e4b9fD1B824FfF343D87eE8625b5032468EB07";

    console.log("Checking upgrade safety...");
    console.log("Proxy:", proxyAddress);

    await upgradesApi.validateUpgrade(
        proxyAddress,
        Pool
    );

    console.log("Upgrade validation PASSED");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
import { network } from "hardhat";

async function main() {
    const connection = await network.connect();

    const token = await connection.ethers.getContractAt(
        "MyToken",
        "0x7C85B886446BBe156a303FD8fC5Fe636E7B2fE49"
    );

    const tx = await token.mint(
        "0x0c74c7e450Aff617208d022D023b0aCA66c69994",
        connection.ethers.parseUnits("1000", 18)
    );

    await tx.wait();

    console.log("Mint completed");
}

main().catch(console.error);
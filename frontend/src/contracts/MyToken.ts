import { ethers } from "ethers";
import tokenJson from "../../../artifacts/contracts/MyToken.sol/MyToken.json";
import { getSigner } from "../provider";

const TOKEN_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";

export async function getToken() {
  const signer = await getSigner();

  return new ethers.Contract(
    TOKEN_ADDRESS,
    tokenJson.abi,
    signer
  );
}
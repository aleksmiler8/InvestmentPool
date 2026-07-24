import { ethers } from "ethers";
import { getSigner } from "../provider";

export const USDT_ADDRESS =
  "0x55d398326f99059fF775485246999027B3197955";

const ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner,address spender) view returns(uint256)",
  "function approve(address spender,uint256 amount) returns(bool)",
  "function decimals() view returns(uint8)"
];

export async function getUSDT() {
  const signer = await getSigner();

  return new ethers.Contract(
    USDT_ADDRESS,
    ABI,
    signer
  );
}
import { ethers } from "ethers";
import { INVESTMENT_POOL_SWAP } from "./addresses";
import { getSigner } from "../provider";

const ABI = [
  "function swapBNBToToken(uint256 amountOutMin,address[] path) payable",
  "function swapTokenToBNB(uint256 amountIn,uint256 amountOutMin,address[] path)",
  "function getAmountsOut(uint256 amountIn,address[] path) view returns (uint256[])",
];

export async function getInvestmentPoolSwap() {
  const signer = await getSigner();

  const contract = new ethers.Contract(
    INVESTMENT_POOL_SWAP,
    ABI,
    signer
  );

  return {
    contract,
    signer,
  };
}
import { ethers } from "ethers";
import { getSigner } from "../provider";
import { InvestmentPoolABI } from "./InvestmentPoolABI";

const CONTRACT_ADDRESS =
"0x1b3030C13Bb837775ed574EfDAF487DfC055b912";

export async function getContract() {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    InvestmentPoolABI,
    signer
  );
}
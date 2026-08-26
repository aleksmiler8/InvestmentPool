import { ethers } from "ethers";
import { getSigner } from "../provider";
import { InvestmentPoolABI } from "./InvestmentPoolABI";

const CONTRACT_ADDRESS =
  "0x8A89567a6863f8dd7cA2Cb235022c00cd95F40c0";

export async function getContract() {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    InvestmentPoolABI,
    signer
  );
}

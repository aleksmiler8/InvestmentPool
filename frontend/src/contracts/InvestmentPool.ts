import { ethers } from "ethers";
import { getSigner } from "../provider";
import { InvestmentPoolABI } from "./InvestmentPoolABI";

const CONTRACT_ADDRESS = "0x5599EcE84aB7aBa2F180a77bb45A6E32C51A94b6";

export async function getContract() {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    InvestmentPoolABI,
    signer
  );
}
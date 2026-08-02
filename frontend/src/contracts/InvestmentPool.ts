import { ethers } from "ethers";
import { getSigner } from "../provider";
import { InvestmentPoolABI } from "./InvestmentPoolABI";

const CONTRACT_ADDRESS =
"0x07385E6867da6cCD37a49420B025eB4a4E9Cb5F6";

export async function getContract() {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    InvestmentPoolABI,
    signer
  );
}
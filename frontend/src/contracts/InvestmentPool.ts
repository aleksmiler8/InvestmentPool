import { ethers } from "ethers";
import { getSigner } from "../provider";
import { InvestmentPoolABI } from "./InvestmentPoolABI";

const CONTRACT_ADDRESS =
"0x5B9736101be66185115874FB4Fe76e3746DC4e93";

export async function getContract() {
  const signer = await getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    InvestmentPoolABI,
    signer
  );
}

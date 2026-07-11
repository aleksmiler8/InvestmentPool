import { ethers } from "ethers";
import { InvestmentPoolABI } from "./InvestmentPoolABI";

const CONTRACT_ADDRESS = "0x8E0D591F0f387e0e87FAa67B647f8C3422A27385";

export async function getContract() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(
    CONTRACT_ADDRESS,
    InvestmentPoolABI,
    signer
  );
}
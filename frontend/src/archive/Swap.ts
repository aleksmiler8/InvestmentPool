import { ethers } from "ethers";

export const ROUTER_ADDRESS =
  "0x..."; // адрес PancakeSwap Router Testnet (добавим следующим шагом)

export async function getRouter() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();

  return { provider, signer };
}
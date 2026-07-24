import { ethers } from "ethers";

export async function getProvider() {
  if (!(window as any).ethereum) {
    throw new Error("Wallet not connected");
  }

  const provider = new ethers.BrowserProvider(
    (window as any).ethereum
  );

  const network = await provider.getNetwork();

  if (network.chainId !== 56n) {
    throw new Error("Please switch MetaMask to BNB Smart Chain.");
}

  return provider;
}

export async function getSigner() {
  const provider = await getProvider();
  return provider.getSigner();
}
import { ethers } from "ethers";
import { getRouter } from "../contracts/PancakeRouter";
import {
  USDT_ADDRESS,
  WBNB_ADDRESS,
} from "../contracts/addresses";

export async function swapBNBToUSDT(amount: string) {
  const { router, signer } = await getRouter();

  const path = [
    WBNB_ADDRESS,
    USDT_ADDRESS,
  ];

  const deadline =
    Math.floor(Date.now() / 1000) + 60 * 10;

  const tx = await router.swapExactETHForTokens(
    0,
    path,
    await signer.getAddress(),
    deadline,
    {
      value: ethers.parseEther(amount),
    }
  );

  return tx.wait();
}
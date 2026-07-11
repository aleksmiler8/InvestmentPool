import { ethers } from "ethers";
import {
  PANCAKE_ROUTER,
  USDT_ADDRESS,
  WBNB_ADDRESS,
} from "./addresses";

const ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) returns (uint[] memory amounts)"
];

export async function getRouter() {
  if (!(window as any).ethereum) {
    throw new Error("MetaMask not found");
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();

  return {
    router: new ethers.Contract(
      PANCAKE_ROUTER,
      ABI,
      signer
    ),
    signer,
  };
}
export async function getBNBPriceFromUSDT(amountIn: bigint) {
  const { router } = await getRouter();

  const path = [
    USDT_ADDRESS,
    WBNB_ADDRESS,
  ];

  const amounts = await router.getAmountsOut(amountIn, path);

  return amounts[1];
}
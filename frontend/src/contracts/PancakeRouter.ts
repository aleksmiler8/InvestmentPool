import { ethers } from "ethers";
import {
  PANCAKE_ROUTER,
  USDT_ADDRESS,
  WBNB_ADDRESS,
} from "./addresses";

import { getSigner } from "../provider";

const ABI = [
  "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)",
  "function swapExactETHForTokens(uint amountOutMin,address[] calldata path,address to,uint deadline) payable returns (uint[] memory amounts)",
  "function swapExactTokensForETH(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) returns (uint[] memory amounts)"
];

export async function getRouter() {
  const signer = await getSigner();

  return {
    router: new ethers.Contract(
      PANCAKE_ROUTER,
      ABI,
      signer
    ),
    signer,
  };
}

// USDT → BNB
export async function getBNBPriceFromUSDT(amountIn: bigint) {
  const { router } = await getRouter();

  const path = [
    USDT_ADDRESS,
    WBNB_ADDRESS,
  ];

  const amounts = await router.getAmountsOut(amountIn, path);

  return amounts[1];
}

// BNB → USDT
export async function getUSDTPriceFromBNB(amountIn: bigint) {
  const { router } = await getRouter();

  const path = [
    WBNB_ADDRESS,
    USDT_ADDRESS,
  ];

  const amounts = await router.getAmountsOut(amountIn, path);

  return amounts[1];
}
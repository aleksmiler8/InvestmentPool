import { ethers } from "ethers";
import { getInvestmentPoolSwap } from "../contracts/InvestmentPoolSwap";
import { getUSDT } from "../contracts/USDT";
import {
  USDT_ADDRESS,
  WBNB_ADDRESS,
} from "../contracts/addresses";

// BNB -> USDT
export async function swapBNBToUSDT(amount: string) {
  const { contract, signer } = await getInvestmentPoolSwap();
  const balance = await signer.provider.getBalance(
  await signer.getAddress()
);

if (balance < ethers.parseEther("0.001")) {
  throw new Error("Not enough BNB to pay gas fees.");
}

  const path = [
    WBNB_ADDRESS,
    USDT_ADDRESS,
  ];
  const amountIn = ethers.parseEther(amount);

const amounts = await contract.getAmountsOut(
  amountIn,
  path
);

const expectedOut = amounts[amounts.length - 1];

// Допустимое проскальзывание 1%
const amountOutMin = expectedOut * 99n / 100n;

  const tx = await contract.swapBNBToToken(
  amountOutMin,
  path,
  {
    value: amountIn,
  }
);
  return tx.wait();
}

// USDT -> BNB
export async function swapUSDTToBNB(amount: string) {
  const { contract, signer } = await getInvestmentPoolSwap();

const balance = await signer.provider.getBalance(
  await signer.getAddress()
);

if (balance < ethers.parseEther("0.001")) {
  throw new Error("Not enough BNB to pay gas fees.");
}

  const token = await getUSDT();

  const amountIn = ethers.parseUnits(amount, 18);

  const approveTx = await token.approve(
  contract.target,
  amountIn
);
  await approveTx.wait();

  const path = [
    USDT_ADDRESS,
    WBNB_ADDRESS,
  ];
  const amounts = await contract.getAmountsOut(
  amountIn,
  path
);

const expectedOut = amounts[amounts.length - 1];

// Допустимое проскальзывание 1%
const amountOutMin = expectedOut * 99n / 100n;

  const tx = await contract.swapTokenToBNB(
  amountIn,
  amountOutMin,
  path
);

  return tx.wait();
}
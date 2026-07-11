import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { bsc } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  okxWallet,
  rabbyWallet,
  walletConnectWallet,
  trustWallet,
} from "@rainbow-me/rainbowkit/wallets";

const config = getDefaultConfig({
  appName: "Investment Pool",
  projectId: "8df61e14118f65008c098cf9046f1d28",

  chains: [bsc],

  wallets: [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        trustWallet,
        okxWallet,
        coinbaseWallet,
        rabbyWallet,
      ],
    },
    {
      groupName: "Other",
      wallets: [
        walletConnectWallet,
      ],
    },
  ],
});

const queryClient = new QueryClient();

export function WalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
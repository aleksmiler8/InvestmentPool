import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc } from "@reown/appkit/networks";

export const projectId = "674ce8b1a76f277e5e792f22432f72e6";

const metadata = {
  name: "Investment Pool",
  description: "Investment Pool",
  url: "http://localhost:5173",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const networks = [bsc] as [typeof bsc];

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  metadata,
});
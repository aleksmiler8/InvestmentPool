import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { bsc } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "Investment Pool",
  projectId: "YOUR_PROJECT_ID",
  chains: [bsc],
});
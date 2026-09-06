import "dotenv/config";

import hardhatEthers from "@nomicfoundation/hardhat-ethers";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [
    hardhatEthers,
    hardhatToolboxViemPlugin,
  ],

  solidity: {
    profiles: {
      default: {
  version: "0.8.28",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    viaIR: true,
  },
},
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },

    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },

    bsc: {
      type: "http",
      chainType: "l1",
      url: configVariable("RPC_URL"),
      accounts: [configVariable("PRIVATE_KEY")],
    },

    bscTestnet: {
      type: "http",
      chainType: "l1",
      url: configVariable("RPC_URL_TESTNET"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});
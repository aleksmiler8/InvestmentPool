import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mainnet, bsc, bscTestnet } from 'wagmi/chains'

export const config = getDefaultConfig({
  appName: 'Investment Pool',
  projectId: '8df61e14118f65008c098cf9046f1d28',
  chains: [mainnet, bsc, bscTestnet],
  ssr: false
})
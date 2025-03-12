// src/config/walletConfig.ts
import { Chain, configureChains, createClient } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  okxWallet,
  phantomWallet,
  trustWallet,
  braveWallet
} from '@rainbow-me/rainbowkit/wallets';

// Define Monad Testnet chain correctly with all required properties
const monadTestnet: Chain = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz/'],
      webSocket: [],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz/'],
      webSocket: [],
    }
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com/' },
  },
  testnet: true,
};

// Configure chains and providers
const { chains, provider } = configureChains(
  [monadTestnet],
  [
    jsonRpcProvider({
      rpc: (chain: Chain) => {
        return { http: chain.rpcUrls.default.http[0] };
      },
    }),
    publicProvider(),
  ]
);

// Get a WalletConnect Project ID from https://cloud.walletconnect.com
const projectId = 'ff1856cb6ee7a714cdabccba6cc32749';

// Create wallet connectors with explicit type casting for compatibility
const connectors = connectorsForWallets([
  {
    groupName: 'Popular',
    wallets: [
      metaMaskWallet({ projectId, chains: [monadTestnet] }),
      walletConnectWallet({ projectId, chains: [monadTestnet] }),
      coinbaseWallet({ appName: 'Meta Relayer', chains: [monadTestnet] }),
      okxWallet({ projectId, chains: [monadTestnet] }) as any,
      phantomWallet({ chains: [monadTestnet] }) as any,
      trustWallet({ projectId, chains: [monadTestnet] }) as any,
      braveWallet({ chains: [monadTestnet] }) as any,
    ] as any[],
  },
] as any);

// Create wagmi client - make sure to prioritize WalletConnect
const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

// Export for RainbowKitProvider
export { wagmiClient, chains };
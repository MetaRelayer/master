// src/components/WalletProvider.tsx
import React from 'react';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig } from 'wagmi';
import { wagmiClient, chains } from '../config/walletConfig';

// Import Rainbow Kit styles
import '@rainbow-me/rainbowkit/styles.css';

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={lightTheme()}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
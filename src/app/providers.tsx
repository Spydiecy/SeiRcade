'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import {defineChain} from 'viem';
import { useEffect, useState } from 'react';
import { PointsProvider } from './contexts/PointsContext';
import { WalletProvider } from './contexts/WalletContext';

export const coreTestnet = defineChain({
  id: 1115,
  name: 'Core Blockchain Testnet',
  network: 'core-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'tCore',
    symbol: 'tCORE',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.btcs.network'],
    },
  },
  blockExplorers: {
    default: {name: 'Core Testnet Explorer', url: 'https://scan.test.btcs.network'},
  },
});

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <PrivyProvider
      appId="cm81bj6ce0093zs43wrr4cizm"
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#FF10F0',
          logo: 'https://corecade.vercel.app/corecade-logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: coreTestnet,
        supportedChains: [coreTestnet],
      }}
    >
      <WalletProvider>
        <PointsProvider>
          {children}
        </PointsProvider>
      </WalletProvider>
    </PrivyProvider>
  );
} 
'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import {defineChain} from 'viem';
import { useEffect, useState } from 'react';
import { PointsProvider } from './contexts/PointsContext';
import { WalletProvider } from './contexts/WalletContext';

export const monadTestnet = defineChain({
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
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com'},
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
          logo: 'https://moncade.vercel.app/moncade-logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
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
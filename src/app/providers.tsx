'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import {defineChain} from 'viem';
import { useEffect, useState } from 'react';
import { PointsProvider } from './contexts/PointsContext';
import { WalletProvider } from './contexts/WalletContext';

export const monadTestnet = defineChain({
  id: 1115,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://monad-testnet.g.alchemy.com/v2/cPagatQQ9SL_dZvqKBJYoc_dG2cHbmcA', 'https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {name: 'Monad Testnet Explorer', url: 'https://monad-testnet.socialscan.io'},
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
          logo: '/moncade-logo.png',
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
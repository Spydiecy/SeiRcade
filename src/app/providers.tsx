'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import {defineChain} from 'viem';
import { useEffect, useState } from 'react';
import { PointsProvider } from './contexts/PointsContext';
import { WalletProvider } from './contexts/WalletContext';

export const educhainTestnet = defineChain({
  id: 1337,
  name: 'educhain Testnet',
  network: 'educhain-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'educhain',
    symbol: 'EDU',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.educhain.xyz'],
      webSocket: ['wss://testnet-rpc.educhain.xyz'],
    },
  },
  blockExplorers: {
    default: {name: 'educhain Explorer', url: 'https://testnet.educhainexplorer.com'},
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
          logo: 'https://edurcade.vercel.app/edurcade-logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: educhainTestnet,
        supportedChains: [educhainTestnet],
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
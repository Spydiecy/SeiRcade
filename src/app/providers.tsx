'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <PrivyProvider
      appId="cm81bj6ce0093zs43wrr4cizm"
      config={{
        loginMethods: ['wallet', 'email', 'google'],
        appearance: {
          theme: 'dark',
          accentColor: '#00f3ff',
          logo: 'https://your-site.com/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
} 
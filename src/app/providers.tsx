'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [privyAppId, setPrivyAppId] = useState<string>('');
  const [privyClientId, setPrivyClientId] = useState<string>('');
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
    const clientId = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID || '';
    setPrivyAppId(appId);
    setPrivyClientId(clientId);
  }, []);

  if (!privyAppId && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen flex justify-center items-center arcade-bg">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      clientId={privyClientId}
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
'use client';

import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

// This is a client component that wraps the app with PrivyProvider
export default function MainLayout({ children }: { children: React.ReactNode }) {
  // Get environment variable for Privy app ID
  const [privyAppId, setPrivyAppId] = useState<string>('');

  useEffect(() => {
    // Get the environment variable on the client side
    // Note: Next.js requires NEXT_PUBLIC_ prefix for client-side env vars
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';
    setPrivyAppId(appId);
  }, []);

  // Only render content when privyAppId is available
  if (!privyAppId && typeof window !== 'undefined') {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black">
        <div className="text-white font-arcade text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['wallet', 'email'],
        appearance: {
          theme: 'dark',
          accentColor: '#4f46e5',
          logo: 'https://your-site.com/logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <LayoutContent>
        {children}
      </LayoutContent>
    </PrivyProvider>
  );
}

// Layout content with the header and footer
function LayoutContent({ children }: { children: React.ReactNode }) {
  const { login, authenticated, user } = usePrivy();

  return (
    <div className="min-h-screen bg-black">
      <header className="container mx-auto py-6 px-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <div className="w-12 h-12 relative mr-3">
            {/* Use a div with background as a placeholder if image isn't available */}
            <div className="w-full h-full bg-blue-700 rounded-full flex items-center justify-center text-white font-arcade">
              C
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-arcade bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            CoreCade
          </h1>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {authenticated ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-white font-arcade text-sm">
                <span className="text-blue-400">Player:</span> {user?.email ? String(user?.email) : (user?.wallet?.address && `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`)}
              </div>
              <Link href="/dashboard" className="btn-arcade">
                Dashboard
              </Link>
            </div>
          ) : (
            <button 
              onClick={() => login()}
              className="btn-arcade"
            >
              Connect Wallet
            </button>
          )}
        </motion.div>
      </header>

      <main className="relative z-20">
        {children}
      </main>

      <footer className="py-8 text-center text-gray-500 font-arcade text-xs">
        <p>© 2025 CoreCade | Built on Core Blockchain</p>
      </footer>
    </div>
  );
}
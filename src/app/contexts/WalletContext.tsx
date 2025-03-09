'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

type WalletContextType = {
  walletAddress: string | null;
  walletConnected: boolean;
  shortAddress: string | null;
  ensName: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { login, logout, authenticated, ready, user } = usePrivy();
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [ensName, setEnsName] = useState<string | null>(null);
  const [shortAddress, setShortAddress] = useState<string | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);

  // Update wallet state when authentication changes
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      const address = user.wallet.address;
      setWalletAddress(address);
      setShortAddress(`${address.slice(0, 6)}...${address.slice(-4)}`);
      setWalletConnected(true);
    } else {
      setWalletAddress(null);
      setShortAddress(null);
      setWalletConnected(false);
    }
  }, [ready, authenticated, user]);

  // Connect wallet function
  const connectWallet = async (): Promise<void> => {
    if (!authenticated) {
      await login();
    }
  };

  // Disconnect wallet function
  const disconnectWallet = async (): Promise<void> => {
    if (authenticated) {
      await logout();
    }
  };

  // Fetch ENS name if available (could be expanded in the future)
  useEffect(() => {
    const fetchEnsName = async () => {
      if (walletAddress) {
        try {
          // This is a placeholder - you could implement actual ENS resolution here
          // For now we'll just set it to null
          setEnsName(null);
        } catch (error) {
          console.error("Error fetching ENS name:", error);
          setEnsName(null);
        }
      }
    };

    fetchEnsName();
  }, [walletAddress]);

  const value = {
    walletAddress,
    walletConnected,
    shortAddress,
    ensName,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === null) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 
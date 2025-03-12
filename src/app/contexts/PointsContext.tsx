'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePointsManager } from '@/hooks/usePointsManager';

type PointsContextType = {
  balance: number;
  convertToPoints: (amount: string | number) => Promise<boolean>;
  withdrawPoints: (amount: string | number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  loading: boolean;
  error: string | null;
  monadPrice: number;
  isLoadingPrice: boolean;
};

const PointsContext = createContext<PointsContextType | null>(null);

export function PointsProvider({ children }: { children: ReactNode }) {
  const { authenticated, user } = usePrivy();
  const { 
    balance, 
    convertToPoints, 
    withdrawPoints, 
    getBalance,
    loading, 
    error 
  } = usePointsManager();

  const [monadPrice, setMonadPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Fetch MONAD price
  useEffect(() => {
    const fetchMonadPrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/prices/MONAD-USD/spot');
        const data = await response.json();
        setMonadPrice(parseFloat(data.data.amount));
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Error fetching MONAD price:', error);
        setIsLoadingPrice(false);
      }
    };

    fetchMonadPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchMonadPrice, 300000);
    return () => clearInterval(interval);
  }, []);

  // Fetch balance whenever authentication state changes
  useEffect(() => {
    if (authenticated && user) {
      getBalance();
    }
  }, [authenticated, user, getBalance]);

  // Refresh function that can be called from any component
  const refreshBalance = async () => {
    if (authenticated && user) {
      await getBalance();
    }
  };

  const value = {
    balance,
    convertToPoints,
    withdrawPoints,
    refreshBalance,
    loading,
    error,
    monadPrice,
    isLoadingPrice
  };

  return (
    <PointsContext.Provider value={value}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints() {
  const context = useContext(PointsContext);
  if (context === null) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
} 
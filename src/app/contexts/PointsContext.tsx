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
  seiPrice: number;
  isLoadingPrice: boolean;
  setManualPrice: (price: number) => void;
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

  const [seiPrice, setSeiPrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Function to manually set price for testing
  const setManualPrice = (price: number) => {
    console.log(`Manually setting SEI price to: $${price}`);
    setSeiPrice(price);
  };

  // Fetch SEI price
  useEffect(() => {
    const fetchSeiPrice = async () => {
      try {
        // Use CryptoCompare API to get the real SEI price
        const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=SEI&tsyms=USD');
        const data = await response.json();
        
        if (data && data.USD) {
          // Use the actual price from the API
          setSeiPrice(data.USD);
        } else {
          // Fallback price if API doesn't return expected data
          console.warn('SEI price data not available from API, using fallback value');
          setSeiPrice(0.170); // Reasonable fallback value
        }
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Error fetching SEI price:', error);
        setSeiPrice(0.1471); // Fallback price
        setIsLoadingPrice(false);
      }
    };

    fetchSeiPrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchSeiPrice, 300000);
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
    seiPrice,
    isLoadingPrice,
    setManualPrice
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
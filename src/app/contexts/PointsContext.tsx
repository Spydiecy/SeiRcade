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
        // Try CoinGecko API first for SEI price (more reliable)
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=sei-network&vs_currencies=usd');
        const data = await response.json();
        
        if (data && data['sei-network'] && data['sei-network'].usd) {
          // Use the actual price from CoinGecko
          const price = data['sei-network'].usd;
          console.log('SEI price from CoinGecko:', price);
          setSeiPrice(price);
          setIsLoadingPrice(false);
          return;
        }
        
        // Fallback to CryptoCompare if CoinGecko fails
        const backupResponse = await fetch('https://min-api.cryptocompare.com/data/price?fsym=SEI&tsyms=USD');
        const backupData = await backupResponse.json();
        
        if (backupData && backupData.USD) {
          // Use the price from CryptoCompare
          const price = backupData.USD;
          console.log('SEI price from CryptoCompare:', price);
          setSeiPrice(price);
        } else {
          // Fallback price if both APIs fail
          console.warn('SEI price data not available from APIs, using fallback value');
          setSeiPrice(0.25); // Updated reasonable fallback value based on recent market data
        }
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Error fetching SEI price:', error);
        setSeiPrice(0.25); // Updated fallback price
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
import { useState } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Custom hook for interacting with the PointsManager contract
 * Provides functions for converting tokens, checking balances, etc.
 */
export function usePointsManager() {
  const { user } = usePrivy();
  const { pointsManager } = useContracts();
  const [balance, setBalance] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Get user's point balance
   * @param address User address (optional, uses connected wallet if not provided)
   */
  const getBalance = async (address?: string) => {
    if (!pointsManager) return 0;
    const userAddress = address || user?.wallet?.address;
    if (!userAddress) return 0;
    
    setLoading(true);
    setError(null);
    
    try {
      const balance = await pointsManager.getPointsBalance(userAddress);
      const formattedBalance = Number(ethers.utils.formatUnits(balance, 0));
      setBalance(formattedBalance);
      return formattedBalance;
    } catch (err: any) {
      console.error("Error getting balance:", err);
      setError(err.message || "Failed to get balance");
      return 0;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get platform conversion rate
   */
  const getConversionRate = async () => {
    if (!pointsManager) return 0;
    
    try {
      const rate = await pointsManager.conversionRate();
      const formattedRate = Number(ethers.utils.formatUnits(rate, 0));
      setConversionRate(formattedRate);
      return formattedRate;
    } catch (err: any) {
      console.error("Error getting conversion rate:", err);
      setError(err.message || "Failed to get conversion rate");
      return 0;
    }
  };
  
  /**
   * Get platform fee percentage
   */
  const getPlatformFee = async () => {
    if (!pointsManager) return 0;
    
    try {
      const fee = await pointsManager.platformFee();
      // Convert from basis points to percentage
      const feePercentage = Number(ethers.utils.formatUnits(fee, 0)) / 100;
      setPlatformFee(feePercentage);
      return feePercentage;
    } catch (err: any) {
      console.error("Error getting platform fee:", err);
      setError(err.message || "Failed to get platform fee");
      return 0;
    }
  };
  
  /**
   * Convert monad tokens to platform points
   * @param amount Amount of monad tokens to convert
   */
  const convertToPoints = async (amount: string | number) => {
    if (!pointsManager) {
      setError("Points manager not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert amount to Wei
      const amountInWei = ethers.utils.parseEther(amount.toString());
      
      const tx = await pointsManager.convertToPoints({ 
        value: amountInWei
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Conversion transaction receipt:", receipt);
      
      // Update balance
      await getBalance();
      return true;
    } catch (err: any) {
      console.error("Error converting to points:", err);
      setError(err.message || "Failed to convert tokens to points");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Withdraw platform points back to monad tokens
   * @param amount Amount of points to withdraw
   */
  const withdrawPoints = async (amount: string | number) => {
    if (!pointsManager) {
      setError("Points manager not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert amount to bigint
      const pointsAmount = ethers.BigNumber.from(amount.toString());
      
      const tx = await pointsManager.withdrawPoints(pointsAmount);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Withdrawal transaction receipt:", receipt);
      
      // Update balance
      await getBalance();
      return true;
    } catch (err: any) {
      console.error("Error withdrawing points:", err);
      setError(err.message || "Failed to withdraw points");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    balance,
    conversionRate,
    platformFee,
    loading,
    error,
    getBalance,
    getConversionRate,
    getPlatformFee,
    convertToPoints,
    withdrawPoints
  };
}
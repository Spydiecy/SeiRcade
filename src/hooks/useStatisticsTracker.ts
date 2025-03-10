import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useContracts } from './useContracts';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Custom hook for interacting with the StatisticsTracker contract
 * Provides functions for retrieving player stats, leaderboards, etc.
 */
export function useStatisticsTracker() {
  const { user } = usePrivy();
  const { statisticsTracker } = useContracts();
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [topEarners, setTopEarners] = useState<string[]>([]);
  const [mostActive, setMostActive] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load user's stats when contract is available
  useEffect(() => {
    if (statisticsTracker && user?.wallet?.address) {
      getPlayerStats(user.wallet.address);
    }
  }, [statisticsTracker, user?.wallet?.address]);
  
  /**
   * Get player statistics
   * @param address User address (optional, uses connected wallet if not provided)
   */
  const getPlayerStats = async (address?: string) => {
    if (!statisticsTracker) return null;
    const userAddress = address || user?.wallet?.address;
    if (!userAddress) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching stats for address: ${userAddress}`);
      const stats = await statisticsTracker.getPlayerStats(userAddress);
      console.log("Raw stats from contract:", stats);
      
      // Create a properly formatted stats object with all required fields
      const formattedStats = {
        gamesPlayed: stats.gamesPlayed ? stats.gamesPlayed.toNumber() : 0,
        gamesWon: stats.gamesWon ? stats.gamesWon.toNumber() : 0,
        wins: stats.gamesWon ? stats.gamesWon.toNumber() : 0, // Alias for dashboard compatibility
        totalEarnings: stats.totalEarnings ? stats.totalEarnings.toString() : '0',
        pointsWon: stats.totalEarnings ? parseInt(stats.totalEarnings.toString()) : 0, // Alias for dashboard
        pointsSpent: stats.totalSpent ? parseInt(stats.totalSpent.toString()) : 0,
        winRate: stats.gamesPlayed && stats.gamesPlayed.toNumber() > 0 
          ? (stats.gamesWon.toNumber() / stats.gamesPlayed.toNumber()) * 100 
          : 0,
        highestScore: stats.highestScore ? stats.highestScore.toNumber() : 0
      };
      
      console.log("Formatted stats:", formattedStats);
      setPlayerStats(formattedStats);
      return formattedStats;
    } catch (err: any) {
      console.error("Error getting player stats:", err);
      // Create default stats object with zeros to prevent UI errors
      const defaultStats = {
        gamesPlayed: 0,
        gamesWon: 0,
        wins: 0,
        totalEarnings: '0',
        pointsWon: 0,
        pointsSpent: 0,
        winRate: 0,
        highestScore: 0
      };
      
      setPlayerStats(defaultStats);
      setError(err.message || "Failed to get player statistics");
      return defaultStats;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get daily statistics for a player
   * @param address User address (optional, uses connected wallet if not provided)
   * @param timestamp Timestamp for the day (0 for current day)
   */
  const getDailyStats = async (address?: string, timestamp: number = 0) => {
    if (!statisticsTracker) return null;
    const userAddress = address || user?.wallet?.address;
    if (!userAddress) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const stats = await statisticsTracker.getDailyStats(userAddress, timestamp);
      
      return {
        wins: stats.wins.toNumber(),
        earnings: stats.earnings.toString()
      };
    } catch (err: any) {
      console.error("Error getting daily stats:", err);
      setError(err.message || "Failed to get daily statistics");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get statistics for a specific game type
   * @param gameType Type of game (0=FlappyBird, 1=AIChallenge)
   */
  const getGameStats = async (gameType: number) => {
    if (!statisticsTracker) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const stats = await statisticsTracker.getGameStats(gameType);
      
      return {
        totalPlayed: stats.totalPlayed.toNumber(),
        totalPrizePool: stats.totalPrizePool.toString(),
        highestScore: stats.highestScore.toNumber(),
        highestScorer: stats.highestScorer
      };
    } catch (err: any) {
      console.error("Error getting game stats:", err);
      setError(err.message || "Failed to get game statistics");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get top earners on the platform
   * @param count Number of top earners to retrieve (default: 10)
   */
  const getTopEarners = async (count: number = 10) => {
    if (!statisticsTracker) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const earners = await statisticsTracker.getTopEarners(count);
      setTopEarners(earners);
      return earners;
    } catch (err: any) {
      console.error("Error getting top earners:", err);
      setError(err.message || "Failed to get top earners");
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get most active players on the platform
   * @param count Number of active players to retrieve (default: 10)
   */
  const getMostActive = async (count: number = 10) => {
    if (!statisticsTracker) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const active = await statisticsTracker.getMostActive(count);
      setMostActive(active);
      return active;
    } catch (err: any) {
      console.error("Error getting most active players:", err);
      setError(err.message || "Failed to get most active players");
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  return {
    playerStats,
    topEarners,
    mostActive,
    loading,
    error,
    getPlayerStats,
    getDailyStats,
    getGameStats,
    getTopEarners,
    getMostActive
  };
}
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useStatisticsTracker } from '@/hooks/useStatisticsTracker';
import { usePoints } from '@/app/contexts/PointsContext';
import { useWallet } from '@/app/contexts/WalletContext';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallet' | 'rooms' | 'stats'>('wallet');
  
  // Use wallet context
  const { walletConnected, connectWallet } = useWallet();
  
  // Use points context
  const { 
    balance, 
    convertToPoints, 
    withdrawPoints, 
    refreshBalance,
    loading: pointsLoading, 
    error: pointsError,
    corePrice,
    isLoadingPrice 
  } = usePoints();
  
  const { 
    userRooms, 
    getRoomDetails,
    loading: gameRoomLoading, 
    error: gameRoomError 
  } = useGameRoom();
  
  const { 
    playerStats, 
    loading: statsLoading, 
    error: statsError 
  } = useStatisticsTracker();
  
  // Form state
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Initialize dashboard data
  useEffect(() => {
    if (walletConnected) {
      const loadData = async () => {
        try {
          setIsLoading(true);
          // Load user balance using context
          await refreshBalance();
          setIsLoading(false);
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setIsLoading(false);
        }
      };

      loadData();
    } else {
      setIsLoading(false);
    }
  }, [walletConnected, refreshBalance]);

  // Show notification
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount) return;
    
    try {
      const success = await convertToPoints(depositAmount);
      
      if (success) {
        showNotification('success', `Successfully deposited ${depositAmount} CORE!`);
        setDepositAmount('');
        // Refresh balance
        await refreshBalance();
      } else {
        showNotification('error', 'Deposit failed. Please try again.');
      }
    } catch (error) {
      console.error('Deposit error:', error);
      showNotification('error', 'An error occurred during deposit.');
    }
  };

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) > balance) return;
    
    try {
      const success = await withdrawPoints(withdrawAmount);
      
      if (success) {
        showNotification('success', `Successfully withdrew ${withdrawAmount} points!`);
        setWithdrawAmount('');
        // Refresh balance
        await refreshBalance();
      } else {
        showNotification('error', 'Withdrawal failed. Please try again.');
      }
    } catch (error) {
      console.error('Withdraw error:', error);
      showNotification('error', 'An error occurred during withdrawal.');
    }
  };

  // If not authenticated, show login screen
  if (!walletConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-game-bg bg-cover bg-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-black/60 backdrop-blur-sm rounded-xl border border-neon-blue">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-arcade text-white">DASHBOARD ACCESS</h2>
            <p className="mt-2 text-sm text-gray-400">Please connect your wallet to continue</p>
          </div>
          <div className="mt-8">
            <button
              onClick={connectWallet}
              className="w-full arcade-button-green"
            >
              CONNECT WALLET
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-bg bg-cover bg-center py-24 px-4">
      <div className="container mx-auto">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-arcade text-white mb-2">PLAYER DASHBOARD</h1>
          <p className="text-gray-400">Manage your arcade assets</p>
        </motion.div>
        
        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed top-20 right-4 z-50 p-4 rounded-md shadow-lg ${
              notification.type === 'success' ? 'bg-green-900/80 border border-neon-green' : 'bg-red-900/80 border border-neon-pink'
            }`}
          >
            <p className="text-white">{notification.message}</p>
          </motion.div>
        )}
        
        {/* Dashboard Tabs */}
        <div className="mb-8 flex justify-center">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-6 py-2 font-arcade text-sm rounded-l-lg ${
                activeTab === 'wallet'
                  ? 'bg-neon-green/20 border-neon-green text-neon-green'
                  : 'bg-black/50 border-gray-700 text-gray-400 hover:bg-black/70'
              } border`}
            >
              WALLET
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-6 py-2 font-arcade text-sm ${
                activeTab === 'rooms'
                  ? 'bg-neon-blue/20 border-neon-blue text-neon-blue'
                  : 'bg-black/50 border-gray-700 text-gray-400 hover:bg-black/70'
              } border-t border-b`}
            >
              MY ROOMS
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-2 font-arcade text-sm rounded-r-lg ${
                activeTab === 'stats'
                  ? 'bg-neon-pink/20 border-neon-pink text-neon-pink'
                  : 'bg-black/50 border-gray-700 text-gray-400 hover:bg-black/70'
              } border`}
            >
              STATS
            </button>
          </div>
        </div>
        
        {/* Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Balance Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-black/50 rounded-lg border border-neon-blue p-6"
            >
              <h2 className="text-2xl font-arcade text-white mb-6">BALANCE</h2>
              <div className="flex flex-col space-y-4">
                <div className="bg-black/30 border border-neon-green p-6 rounded-md">
                  <p className="text-gray-400 text-sm mb-2">Available Points</p>
                  <div className="flex items-end">
                    <p className="text-4xl font-arcade text-neon-green">
                      {isLoading || pointsLoading ? (
                        <span className="loading-dots">
                          <span>.</span><span>.</span><span>.</span>
                        </span>
                      ) : (
                        balance.toLocaleString()
                      )}
                    </p>
                    <p className="ml-2 text-gray-400 mb-1">PTS</p>
                  </div>
                  
                  {!isLoadingPrice && corePrice > 0 && (
                    <p className="text-gray-500 text-sm mt-2">
                      ≈ ${((balance / 1000) * corePrice).toFixed(2)} USD
                    </p>
                  )}
                </div>

                <div className="bg-black/30 border border-neon-blue p-6 rounded-md">
                  <p className="text-gray-400 text-sm mb-2">Equivalent CORE Balance</p>
                  <div className="flex items-end">
                    <p className="text-3xl font-arcade text-neon-blue">
                      {isLoading || pointsLoading ? (
                        <span className="loading-dots">
                          <span>.</span><span>.</span><span>.</span>
                        </span>
                      ) : (
                        (balance / 1000).toFixed(3)
                      )}
                    </p>
                    <p className="ml-2 text-gray-400 mb-1">CORE</p>
                  </div>
                  
                  {!isLoadingPrice && corePrice > 0 && (
                    <p className="text-gray-500 text-sm mt-2">
                      ≈ ${((balance / 1000) * corePrice).toFixed(2)} USD
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
            
            {/* Deposit/Withdraw Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Deposit Card */}
              <div className="bg-black/50 border border-neon-green rounded-md p-6">
                <h3 className="text-xl font-arcade text-white mb-4">DEPOSIT</h3>
                <div className="text-gray-300 text-sm mb-4 space-y-2">
                  <p className="cyberpunk-text">
                    Convert CORE tokens to platform points.
                  </p>
                  <p className="text-xs text-gray-400">
                    Rate: 1 CORE = 1,000 Points
                    {!isLoadingPrice && corePrice > 0 && ` (≈ $${corePrice.toFixed(2)} USD)`}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={pointsLoading}
                    className="flex-grow bg-black/80 border border-neon-green text-white p-2 rounded-l-md focus:outline-none"
                    placeholder="Amount in CORE"
                  />
                  <button
                    onClick={handleDeposit}
                    disabled={pointsLoading || !depositAmount}
                    className="arcade-button-green rounded-l-none"
                  >
                    {pointsLoading ? 'PROCESSING...' : 'DEPOSIT'}
                  </button>
                </div>
                {depositAmount && !isNaN(parseFloat(depositAmount)) && (
                  <div className="mt-2 text-sm space-y-1">
                    <p className="text-gray-300">
                      You will receive: {(parseFloat(depositAmount) * 1000).toLocaleString()} Points
                    </p>
                    {!isLoadingPrice && corePrice > 0 && (
                      <p className="text-gray-400">
                        Value: ${(parseFloat(depositAmount) * corePrice).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Withdraw Card */}
              <div className="bg-black/50 border border-neon-pink rounded-md p-6">
                <h3 className="text-xl font-arcade text-white mb-4">WITHDRAW</h3>
                <div className="text-gray-300 text-sm mb-4 space-y-2">
                  <p className="cyberpunk-text">
                    Convert platform points back to CORE tokens.
                  </p>
                  <p className="text-xs text-gray-400">
                    Rate: 1,000 Points = 1 CORE
                    {!isLoadingPrice && corePrice > 0 && ` (≈ $${corePrice.toFixed(2)} USD)`}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={pointsLoading}
                    className="flex-grow bg-black/80 border border-neon-pink text-white p-2 rounded-l-md focus:outline-none"
                    placeholder="Amount in points"
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={pointsLoading || !withdrawAmount || parseFloat(withdrawAmount) > balance}
                    className="arcade-button-pink rounded-l-none"
                  >
                    {pointsLoading ? 'PROCESSING...' : 'WITHDRAW'}
                  </button>
                </div>
                {withdrawAmount && !isNaN(parseFloat(withdrawAmount)) && (
                  <div className="mt-2 text-sm space-y-1">
                    <p className="text-gray-300">
                      You will receive: {(parseFloat(withdrawAmount) / 1000).toFixed(3)} CORE
                    </p>
                    {!isLoadingPrice && corePrice > 0 && (
                      <p className="text-gray-400">
                        Value: ${((parseFloat(withdrawAmount) / 1000) * corePrice).toFixed(2)} USD
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Rooms Tab */}
        {activeTab === 'rooms' && (
          <div className="bg-black/50 rounded-lg border border-neon-blue p-6">
            <h2 className="text-2xl font-arcade text-white mb-6">MY GAME ROOMS</h2>
            
            {gameRoomLoading ? (
              <div className="text-center py-8">
                <p className="text-white">Loading rooms...</p>
              </div>
            ) : userRooms && userRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRooms.map((roomId) => (
                  <RoomCard key={roomId} roomId={roomId} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You haven't created or joined any game rooms yet.</p>
                <Link href="/games" className="arcade-button-green">
                  FIND GAMES
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="bg-black/50 rounded-lg border border-neon-blue p-6">
            <h2 className="text-2xl font-arcade text-white mb-6">MY STATISTICS</h2>
            
            {statsLoading ? (
              <div className="text-center py-8">
                <p className="text-white">Loading statistics...</p>
              </div>
            ) : playerStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-black/30 p-4 rounded-md border border-neon-green">
                  <h3 className="text-lg font-arcade text-white mb-3">GAMES PLAYED</h3>
                  <p className="text-3xl font-arcade text-neon-green">{playerStats.gamesPlayed || 0}</p>
                </div>
                
                <div className="bg-black/30 p-4 rounded-md border border-neon-blue">
                  <h3 className="text-lg font-arcade text-white mb-3">WINS</h3>
                  <p className="text-3xl font-arcade text-neon-blue">{playerStats.wins || 0}</p>
                </div>
                
                <div className="bg-black/30 p-4 rounded-md border border-neon-pink">
                  <h3 className="text-lg font-arcade text-white mb-3">WIN RATE</h3>
                  <p className="text-3xl font-arcade text-neon-pink">
                    {(playerStats.gamesPlayed && playerStats.wins && playerStats.gamesPlayed > 0) 
                      ? `${((playerStats.wins / playerStats.gamesPlayed) * 100).toFixed(1)}%` 
                      : '0%'}
                  </p>
                </div>
                
                <div className="bg-black/30 p-4 rounded-md border border-yellow-400">
                  <h3 className="text-lg font-arcade text-white mb-3">TOTAL POINTS WON</h3>
                  <p className="text-3xl font-arcade text-yellow-400">
                    {(playerStats.pointsWon || 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-black/30 p-4 rounded-md border border-purple-400">
                  <h3 className="text-lg font-arcade text-white mb-3">TOTAL POINTS SPENT</h3>
                  <p className="text-3xl font-arcade text-purple-400">
                    {(playerStats.pointsSpent || 0).toLocaleString()}
                  </p>
                </div>
                
                <div className="bg-black/30 p-4 rounded-md border border-cyan-400">
                  <h3 className="text-lg font-arcade text-white mb-3">NET PROFIT</h3>
                  <p className={`text-3xl font-arcade ${
                    (playerStats.pointsWon || 0) - (playerStats.pointsSpent || 0) >= 0 
                      ? 'text-neon-green' 
                      : 'text-neon-pink'
                  }`}>
                    {((playerStats.pointsWon || 0) - (playerStats.pointsSpent || 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No statistics available. Play some games to see your stats!</p>
                <Link href="/games" className="arcade-button-green block mt-4 max-w-xs mx-auto">
                  FIND GAMES
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RoomCard({ roomId }: { roomId: number }) {
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { getRoomDetails } = useGameRoom();
  
  useEffect(() => {
    async function loadRoom() {
      try {
        setLoading(true);
        const roomDetails = await getRoomDetails(roomId);
        setRoom(roomDetails);
        setLoading(false);
      } catch (error) {
        console.error(`Error loading room ${roomId}:`, error);
        setLoading(false);
      }
    }
    
    loadRoom();
  }, [roomId, getRoomDetails]);
  
  const getGameTypeName = (type: number) => {
    const gameTypes: {[key: number]: string} = {
      0: 'Poker',
      1: 'Blackjack',
    };
    return gameTypes[type] || 'Unknown';
  };
  
  const getStatusName = (status: number) => {
    const statusTypes: {[key: number]: string} = {
      0: 'Waiting',
      1: 'In Progress',
      2: 'Completed',
    };
    return statusTypes[status] || 'Unknown';
  };
  
  const getStatusColor = (status: number) => {
    const statusColors: {[key: number]: string} = {
      0: 'text-yellow-400',
      1: 'text-neon-blue',
      2: 'text-neon-green',
    };
    return statusColors[status] || 'text-white';
  };
  
  if (loading) {
    return (
      <div className="bg-black/30 border border-gray-700 rounded-md p-4 h-40 flex items-center justify-center">
        <p className="text-gray-400">Loading room...</p>
      </div>
    );
  }
  
  if (!room) {
    return (
      <div className="bg-black/30 border border-gray-700 rounded-md p-4 h-40 flex items-center justify-center">
        <p className="text-gray-400">Room not found</p>
      </div>
    );
  }
  
  return (
    <div className="bg-black/30 border border-gray-700 hover:border-neon-blue transition-colors duration-200 rounded-md p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-arcade text-white mb-2">{room.name || `Room #${roomId}`}</h3>
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(room.status)}`}>
          {getStatusName(room.status)}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Game:</span> {getGameTypeName(room.gameType)}
        </p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Buy-in:</span> {room.buyIn.toLocaleString()} points
        </p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Players:</span> {room.currentPlayers}/{room.maxPlayers}
        </p>
      </div>
      
      <Link 
        href={`/game/${roomId}`}
        className="text-neon-blue text-sm hover:underline inline-block"
      >
        {room.status === 0 ? 'Join Game →' :
         room.status === 1 ? 'Return to Game →' :
         'View Results →'}
      </Link>
    </div>
  );
}
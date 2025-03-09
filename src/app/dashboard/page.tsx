'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePointsManager } from '@/hooks/usePointsManager';
import { useGameRoom, GameType, RoomType, RoomStatus } from '@/hooks/useGameRoom';
import { useStatisticsTracker } from '@/hooks/useStatisticsTracker';

export default function DashboardPage() {
  const { ready, authenticated, user, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wallet' | 'rooms' | 'stats'>('wallet');
  
  // Hook state
  const { 
    balance, 
    convertToPoints, 
    withdrawPoints, 
    getBalance,
    loading: pointsLoading, 
    error: pointsError 
  } = usePointsManager();
  
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
  const [corePrice, setCorePrice] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Fetch CORE price
  useEffect(() => {
    const fetchCorePrice = async () => {
      try {
        const response = await fetch('https://api.coinbase.com/v2/prices/CORECHAIN-USD/spot');
        const data = await response.json();
        setCorePrice(parseFloat(data.data.amount));
        setIsLoadingPrice(false);
      } catch (error) {
        console.error('Error fetching CORE price:', error);
        setIsLoadingPrice(false);
      }
    };

    fetchCorePrice();
    // Refresh price every 5 minutes
    const interval = setInterval(fetchCorePrice, 300000);
    return () => clearInterval(interval);
  }, []);

  // Initialize dashboard data
  useEffect(() => {
    // Simulate loading for smooth animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Load blockchain data when authenticated
  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      getBalance(user.wallet.address);
    }
  }, [ready, authenticated, user]);
  
  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid amount to deposit'
      });
      return;
    }
    
    try {
      const result = await convertToPoints(depositAmount);
      if (result) {
        setNotification({
          type: 'success',
          message: `Successfully converted ${depositAmount} CORE to points!`
        });
        setDepositAmount('');
      } else {
        setNotification({
          type: 'error',
          message: 'Transaction failed. Please try again.'
        });
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'An error occurred during deposit'
      });
    }
  };
  
  // Handle withdraw
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setNotification({
        type: 'error',
        message: 'Please enter a valid amount to withdraw'
      });
      return;
    }
    
    if (parseFloat(withdrawAmount) > balance) {
      setNotification({
        type: 'error',
        message: 'Insufficient balance for withdrawal'
      });
      return;
    }
    
    try {
      const result = await withdrawPoints(withdrawAmount);
      if (result) {
        setNotification({
          type: 'success',
          message: `Successfully withdrew ${withdrawAmount} points to CORE!`
        });
        setWithdrawAmount('');
      } else {
        setNotification({
          type: 'error',
          message: 'Transaction failed. Please try again.'
        });
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'An error occurred during withdrawal'
      });
    }
  };

  if (!ready || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center arcade-bg">
        <div className="loading"></div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center arcade-bg">
        <div className="text-center max-w-md px-6">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-arcade neon-text mb-6"
          >
            ACCESS DENIED
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-gray-300 mb-8 cyberpunk-text"
          >
            Connect your wallet to access your dashboard and manage your CoreCade account.
          </motion.p>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            onClick={() => login()}
            className="arcade-button-glow-blue"
          >
            CONNECT WALLET
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-16 arcade-bg min-h-screen">
      <div className="container mx-auto px-4">
        {/* Dashboard Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-arcade neon-text glitch-text" data-text="DASHBOARD">
            DASHBOARD
          </h1>
          <div className="h-1 w-40 bg-gradient-to-r from-neon-blue via-neon-pink to-transparent mt-2"></div>
        </motion.div>
        
        {/* Notification */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-md ${
              notification.type === 'success' 
                ? 'bg-green-900/30 border border-neon-green text-neon-green' 
                : 'bg-red-900/30 border border-red-500 text-red-400'
            }`}
          >
            <div className="flex justify-between items-center">
              <p>{notification.message}</p>
              <button 
                onClick={() => setNotification(null)} 
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 mb-8">
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'wallet' 
              ? 'text-neon-blue border-neon-blue' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('wallet')}
          >
            WALLET
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'rooms' 
              ? 'text-neon-green border-neon-green' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('rooms')}
          >
            MY ROOMS
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'stats' 
              ? 'text-neon-pink border-neon-pink' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            STATISTICS
          </button>
        </div>
        
        {/* Wallet Tab Content */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Points Balance Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-black/50 border border-neon-blue rounded-md p-6"
            >
              <h3 className="text-xl font-arcade text-white mb-4">POINTS BALANCE</h3>
              <div className="text-4xl font-arcade text-neon-blue mb-6">
                {pointsLoading ? (
                  <span className="text-xl">LOADING...</span>
                ) : (
                  <>{balance.toLocaleString()}</>
                )}
              </div>
              
              <p className="text-gray-300 text-sm mb-6 cyberpunk-text">
                These points can be used to enter game rooms and compete with other players. Win games to earn more points!
              </p>
              
              <div className="flex justify-center">
                <Link href="/games" className="arcade-button-blue">
                  PLAY GAMES
                </Link>
              </div>
            </motion.div>
            
            {/* Conversion Cards */}
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
        
        {/* Rooms Tab Content */}
        {activeTab === 'rooms' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-arcade text-white">MY GAME ROOMS</h3>
              <Link href="/games" className="arcade-button-green">
                CREATE NEW ROOM
              </Link>
            </div>
            
            {gameRoomLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loading"></div>
              </div>
            ) : userRooms && userRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userRooms.map((roomId) => (
                  <RoomCard key={roomId} roomId={roomId} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-black/50 border border-gray-800 rounded-md">
                <h4 className="text-2xl font-arcade neon-text mb-4">NO ACTIVE ROOMS</h4>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  You don't have any active game rooms. Create a new room or join an existing one!
                </p>
                <Link href="/games" className="arcade-button-blue">
                  BROWSE GAMES
                </Link>
              </div>
            )}
          </motion.div>
        )}
        
        {/* Statistics Tab Content */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-xl font-arcade text-white mb-6">MY STATISTICS</h3>
            
            {statsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="loading"></div>
              </div>
            ) : playerStats ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/50 border border-neon-blue rounded-md p-6 text-center">
                  <div className="text-gray-400 font-arcade mb-2">GAMES PLAYED</div>
                  <div className="text-3xl font-arcade neon-text-blue">{playerStats.gamesPlayed}</div>
                </div>
                
                <div className="bg-black/50 border border-neon-green rounded-md p-6 text-center">
                  <div className="text-gray-400 font-arcade mb-2">WIN RATE</div>
                  <div className="text-3xl font-arcade neon-text-green">{playerStats.winRate.toFixed(2)}%</div>
                </div>
                
                <div className="bg-black/50 border border-neon-pink rounded-md p-6 text-center">
                  <div className="text-gray-400 font-arcade mb-2">TOTAL EARNINGS</div>
                  <div className="text-3xl font-arcade neon-text-pink">{parseInt(playerStats.totalEarnings).toLocaleString()}</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-black/50 border border-gray-800 rounded-md">
                <h4 className="text-2xl font-arcade neon-text-pink mb-4">NO STATS YET</h4>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Play some games to start building your statistics! Your gameplay data will be recorded on the blockchain.
                </p>
                <Link href="/games" className="arcade-button-pink">
                  START PLAYING
                </Link>
              </div>
            )}
            
            <div className="bg-black/50 border border-gray-800 rounded-md p-6 mt-8">
              <h4 className="text-xl font-arcade text-white mb-4">ACHIEVEMENTS</h4>
              <p className="text-gray-300 mb-6">
                Complete these challenges to earn bonus points and unlock special rewards!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                  <div className="flex justify-between mb-2">
                    <div className="font-arcade text-neon-blue">First Game</div>
                    <div className="text-xs text-gray-400">+100 POINTS</div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Play your first game on CoreCade</p>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-blue" style={{ width: playerStats && playerStats.gamesPlayed > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                  <div className="flex justify-between mb-2">
                    <div className="font-arcade text-neon-green">First Win</div>
                    <div className="text-xs text-gray-400">+200 POINTS</div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Win your first game on CoreCade</p>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-green" style={{ width: playerStats && playerStats.gamesWon > 0 ? '100%' : '0%' }}></div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                  <div className="flex justify-between mb-2">
                    <div className="font-arcade text-neon-pink">High Earner</div>
                    <div className="text-xs text-gray-400">+500 POINTS</div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Earn 10,000 points from games</p>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-neon-pink" 
                      style={{ 
                        width: playerStats && parseInt(playerStats.totalEarnings) >= 10000 
                          ? '100%' 
                          : playerStats 
                            ? `${(parseInt(playerStats.totalEarnings) / 10000) * 100}%` 
                            : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                  <div className="flex justify-between mb-2">
                    <div className="font-arcade text-neon-purple">Game Master</div>
                    <div className="text-xs text-gray-400">+1000 POINTS</div>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Win 10 games on CoreCade</p>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500" 
                      style={{ 
                        width: playerStats && playerStats.gamesWon >= 10 
                          ? '100%' 
                          : playerStats 
                            ? `${(playerStats.gamesWon / 10) * 100}%` 
                            : '0%' 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Room Card Component
function RoomCard({ roomId }: { roomId: number }) {
  const { getRoomDetails, loading } = useGameRoom();
  const [room, setRoom] = useState<any>(null);
  
  useEffect(() => {
    async function loadRoom() {
      const details = await getRoomDetails(roomId);
      setRoom(details);
    }
    
    loadRoom();
  }, [roomId, getRoomDetails]);
  
  if (loading || !room) {
    return (
      <div className="bg-black/50 border border-gray-800 rounded-md p-6 h-48 flex items-center justify-center">
        <div className="loading"></div>
      </div>
    );
  }
  
  const getGameTypeName = (type: number) => {
    const types = ['FLAPPY BIRD', 'AI CHALLENGE'];
    return types[type] || 'UNKNOWN GAME';
  };
  
  const getStatusName = (status: number) => {
    const statuses = ['FILLING', 'ACTIVE', 'COMPLETED', 'EXPIRED', 'CANCELED'];
    return statuses[status] || 'UNKNOWN STATUS';
  };
  
  const getStatusColor = (status: number) => {
    const colors = [
      'bg-blue-900/20 text-neon-blue border-neon-blue',      // Filling
      'bg-green-900/20 text-neon-green border-neon-green',   // Active
      'bg-purple-900/20 text-neon-pink border-neon-pink',    // Completed
      'bg-red-900/20 text-red-400 border-red-400',           // Expired
      'bg-gray-900/20 text-gray-400 border-gray-500'         // Canceled
    ];
    return colors[status] || colors[4];
  };
  
  return (
    <div className="bg-black/60 border border-gray-800 rounded-md p-6 relative">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-arcade text-neon-blue">ROOM #{roomId}</h4>
          <p className="text-sm text-gray-400">{getGameTypeName(room.gameType)}</p>
        </div>
        <div className={`text-xs px-2 py-1 border ${getStatusColor(room.status)}`}>
          {getStatusName(room.status)}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-gray-400 mb-1">ENTRY FEE</p>
          <p className="text-neon-green">{parseInt(room.entryFee).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">PRIZE POOL</p>
          <p className="text-neon-pink">{parseInt(room.prizePool).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">PLAYERS</p>
          <p className="text-white">{room.currentPlayers}/{room.maxPlayers}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">CREATED</p>
          <p className="text-white">{new Date(room.creationTime * 1000).toLocaleString()}</p>
        </div>
      </div>
      
      {room.status === 0 && ( // Filling
        <Link href={`/games?room=${roomId}`} className="w-full arcade-button-blue text-center">
          JOIN GAME
        </Link>
      )}
      
      {room.status === 1 && ( // Active
        <Link href={`/games?room=${roomId}`} className="w-full arcade-button-green text-center">
          PLAY NOW
        </Link>
      )}
      
      {room.status === 2 && room.winner === "0x0000000000000000000000000000000000000000" && ( // Completed with no winner yet
        <div className="w-full arcade-button-purple text-center cursor-default">
          GAME COMPLETED
        </div>
      )}
      
      {room.status === 2 && room.winner !== "0x0000000000000000000000000000000000000000" && ( // Completed with winner
        <div className="w-full arcade-button-pink text-center cursor-default">
          WINNER: {room.winner.slice(0, 6)}...{room.winner.slice(-4)}
        </div>
      )}
      
      {(room.status === 3 || room.status === 4) && ( // Expired or Canceled
        <div className="w-full arcade-button-gray text-center cursor-default">
          {room.status === 3 ? 'ROOM EXPIRED' : 'ROOM CANCELED'}
        </div>
      )}
    </div>
  );
}
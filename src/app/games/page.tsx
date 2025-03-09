'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import FlappyBird from '@/components/games/FlappyBird';
import AIChallenge from '@/components/games/AIChallenge';
import { usePrivy } from '@privy-io/react-auth';
import { useGameRoom, GameType, RoomType, RoomStatus } from '@/hooks/useGameRoom';
import { usePointsManager } from '@/hooks/usePointsManager';

export default function GamesPage() {
  const searchParams = useSearchParams();
  const { authenticated, login } = usePrivy();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joinRoomId, setJoinRoomId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Game states
  const [gameSessionData, setGameSessionData] = useState<{
    roomId: number | null;
    entryFee: string;
    maxPlayers: number;
    gameType: number;
    currentPlayers: number;
  } | null>(null);
  const [gameScore, setGameScore] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{
    success: boolean;
    message: string;
    winnings?: string;
  } | null>(null);
  
  // Contract hooks
  const { 
    createRoom, 
    joinRoom, 
    submitScore, 
    claimPrize,
    getRoomDetails,
    getPlayersInRoom,
    loading: gameRoomLoading, 
    error: gameRoomError
  } = useGameRoom();
  
  const { 
    balance: pointsBalance, 
    getBalance, 
    loading: pointsLoading
  } = usePointsManager();
  
  // Room creation form state
  const [roomSettings, setRoomSettings] = useState({
    entryFee: '50',
    maxPlayers: '2',
    gameType: 'FlappyBird',
    roomType: 'public',
    inviteCode: '',
    expirationTime: '3600'
  });
  
  // Active rooms from blockchain
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // Check for room ID in URL parameters
  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      const roomId = parseInt(roomParam);
      if (!isNaN(roomId)) {
        setActiveRoomId(roomId);
        loadRoomDetails(roomId);
      }
    }
    
    // Initial loading effect
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Load active rooms
    loadActiveRooms();
  }, [searchParams]);
  
  // Refresh user balance when authenticated
  useEffect(() => {
    if (authenticated) {
      getBalance();
    }
  }, [authenticated]);
  
  // Load room details
  const loadRoomDetails = async (roomId: number) => {
    try {
      const room = await getRoomDetails(roomId);
      if (room) {
        setGameSessionData({
          roomId,
          entryFee: room.entryFee,
          maxPlayers: room.maxPlayers,
          gameType: room.gameType,
          currentPlayers: room.currentPlayers
        });
        
        if (room.gameType === GameType.FlappyBird) {
          setActiveGame('flappy-bird');
        } else if (room.gameType === GameType.AIChallenge) {
          setActiveGame('ai-challenge');
        }
      }
    } catch (error) {
      console.error("Error loading room details:", error);
      setNotification({
        type: 'error',
        message: 'Failed to load room details. Please try again.'
      });
    }
  };
  
  // Load active filling/public rooms
  const loadActiveRooms = async () => {
    setLoadingRooms(true);
    
    try {
      // In production, you'd implement a more efficient way to query active rooms
      // This is a simplified approach that loads rooms with IDs 1-20 and filters filling ones
      const roomPromises = [];
      for (let i = 1; i <= 20; i++) {
        roomPromises.push(getRoomDetails(i).catch(() => null));
      }
      
      const rooms = await Promise.all(roomPromises);
      const fillingRooms = rooms
        .filter(room => room && room.status === RoomStatus.Filling)
        .map(room => ({
          id: room!.id,
          game: room!.gameType === GameType.FlappyBird ? 'FLAPPY BIRD' : 'AI CHALLENGE',
          entry: room!.entryFee,
          players: `${room!.currentPlayers}/${room!.maxPlayers}`,
          time: formatTimeAgo(room!.creationTime),
          type: room!.roomType === RoomType.Public ? 'PUBLIC' : 'PRIVATE'
        }));
    } catch (error) {
      console.error("Error loading active rooms:", error);
    } finally {
      setLoadingRooms(false);
    }
  };
  
  // Format timestamp to "X min ago" format
  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };
  
  // Handle game start
  const handleGameStart = () => {
    console.log('Game started');
    setGameScore(null);
    setGameResult(null);
  };
  
  // Handle game over
  const handleGameOver = async (score: number) => {
    console.log(`Game over with score: ${score}`);
    setGameScore(score);
    
    // If we're in a room, submit the score to the blockchain
    if (gameSessionData?.roomId) {
      try {
        console.log(`Submitting score ${score} for room ${gameSessionData.roomId}`);
        const result = await submitScore(gameSessionData.roomId, score);
        
        if (result) {
          setNotification({
            type: 'success',
            message: 'Score submitted successfully! Waiting for other players to finish...'
          });
          
          // Check if this player won (this would need to be enhanced with event listening)
          // For now, just fetch the room details again
          setTimeout(async () => {
            const updatedRoom = await getRoomDetails(gameSessionData.roomId!);
            
            if (updatedRoom && updatedRoom.status === RoomStatus.Completed) {
              // Get the user's wallet address
              const { user } = usePrivy();
              const userAddress = user?.wallet?.address;
              
              if (updatedRoom.winner && updatedRoom.winner.toLowerCase() === userAddress?.toLowerCase()) {
                // Player won!
                setGameResult({
                  success: true,
                  message: 'Congratulations! You won the game!',
                  winnings: updatedRoom.prizePool
                });
                
                // If prize not claimed yet, offer to claim
                if (!updatedRoom.prizeClaimed) {
                  // Show claim prize button/notification
                }
              } else if (updatedRoom.winner) {
                // Game completed but player didn't win
                setGameResult({
                  success: false,
                  message: 'Game over! Another player had a higher score.'
                });
              }
            }
          }, 5000); // Check after 5 seconds
        } else {
          setNotification({
            type: 'error',
            message: 'Failed to submit score. Please try again.'
          });
        }
      } catch (error: any) {
        console.error("Error submitting score:", error);
        setNotification({
          type: 'error',
          message: `Error: ${error.message || 'Failed to submit score'}`
        });
      }
    }
  };
  
  // Handle claim prize
  const handleClaimPrize = async (roomId: number) => {
    try {
      const result = await claimPrize(roomId);
      
      if (result) {
        setNotification({
          type: 'success',
          message: 'Prize claimed successfully!'
        });
        
        // Refresh balance
        getBalance();
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to claim prize. Please try again.'
        });
      }
    } catch (error: any) {
      console.error("Error claiming prize:", error);
      setNotification({
        type: 'error',
        message: `Error: ${error.message || 'Failed to claim prize'}`
      });
    }
  };
  
  // Handle room creation
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authenticated) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to create a room'
      });
      return;
    }
    
    try {
      const gameTypeValue = roomSettings.gameType === 'FlappyBird' ? GameType.FlappyBird : GameType.AIChallenge;
      const roomTypeValue = roomSettings.roomType === 'public' ? RoomType.Public : RoomType.Private;
      
      console.log("Creating room with settings:", {
        entryFee: roomSettings.entryFee,
        maxPlayers: parseInt(roomSettings.maxPlayers),
        gameType: gameTypeValue,
        roomType: roomTypeValue,
        inviteCode: roomSettings.inviteCode,
        expirationTime: parseInt(roomSettings.expirationTime)
      });
      
      const roomId = await createRoom(
        roomSettings.entryFee,
        parseInt(roomSettings.maxPlayers),
        gameTypeValue,
        roomTypeValue,
        roomSettings.inviteCode,
        parseInt(roomSettings.expirationTime)
      );
      
      if (roomId) {
        setNotification({
          type: 'success',
          message: `Room created successfully with ID: ${roomId}`
        });
        
        // Close modal
        setShowRoomModal(false);
        
        // Reload active rooms
        loadActiveRooms();
        
        // Enter the created room
        setActiveRoomId(roomId);
        loadRoomDetails(roomId);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to create room. Please try again.'
        });
      }
    } catch (error: any) {
      console.error("Error creating room:", error);
      setNotification({
        type: 'error',
        message: `Error: ${error.message || 'Failed to create room'}`
      });
    }
  };
  
  // Handle joining a room
  const handleJoinRoom = async (roomId: number, inviteCode: string = '') => {
    if (!authenticated) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to join a room'
      });
      return;
    }
    
    try {
      const result = await joinRoom(roomId, inviteCode);
      
      if (result) {
        setNotification({
          type: 'success',
          message: 'Joined room successfully!'
        });
        
        // Close modal if open
        setShowJoinModal(false);
        
        // Enter the joined room
        setActiveRoomId(roomId);
        loadRoomDetails(roomId);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to join room. Please try again.'
        });
      }
    } catch (error: any) {
      console.error("Error joining room:", error);
      setNotification({
        type: 'error',
        message: `Error: ${error.message || 'Failed to join room'}`
      });
    }
  };
  
  // Update room settings
  const updateRoomSettings = (key: string, value: string) => {
    setRoomSettings({
      ...roomSettings,
      [key]: value
    });
  };
  
  // Start join process for a room
  const startJoinRoom = (roomId: number, isPrivate: boolean) => {
    setJoinRoomId(roomId);
    
    if (isPrivate) {
      setShowJoinModal(true);
    } else {
      handleJoinRoom(roomId);
    }
  };
  
  // Reset game session
  const resetGameSession = () => {
    setActiveGame(null);
    setActiveRoomId(null);
    setGameSessionData(null);
    setGameScore(null);
    setGameResult(null);
  };
  
  // Available games data (static information)
  const availableGames = [
    {
      id: 'flappy-bird',
      title: 'FLAPPY BIRD',
      description: 'Navigate through obstacles and compete for the highest score in this arcade classic.',
      image: '/images/games/flappy-preview.png',
      color: 'blue',
      players: '248',
      rating: 4.8
    },
    {
      id: 'ai-challenge',
      title: 'AI CHALLENGE',
      description: 'Try to trick the AI into saying a specific word within the time limit.',
      image: '/images/games/ai-preview.png',
      color: 'green',
      players: '192',
      rating: 4.5
    },
    {
      id: 'cyber-racer',
      title: 'CYBER RACER',
      description: 'Race against other players in this fast-paced arcade racer.',
      image: '/images/games/cyber-preview.png',
      color: 'pink',
      players: '157',
      rating: 4.2,
      comingSoon: true
    },
    {
      id: 'memory-hacker',
      title: 'MEMORY HACKER',
      description: 'Test your memory skills in this cyberpunk themed game.',
      image: '/images/games/memory-preview.png',
      color: 'purple',
      players: '124',
      rating: 4.3,
      comingSoon: true
    }
  ];
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center arcade-bg">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 arcade-bg min-h-screen">
      {activeGame ? (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-between items-center mb-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="arcade-button-blue"
              onClick={resetGameSession}
            >
              ← BACK TO GAMES
            </motion.button>
            
            {authenticated && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="arcade-button-green"
                onClick={() => setShowRoomModal(true)}
              >
                CREATE ROOM
              </motion.button>
            )}
          </div>
          
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
          
          {/* Game session info */}
          {gameSessionData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-black/60 border border-neon-blue rounded-md"
            >
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <h3 className="text-lg font-arcade text-neon-blue">ROOM #{gameSessionData.roomId}</h3>
                  <p className="text-xs text-gray-400">
                    Entry: <span className="text-neon-green">{parseInt(gameSessionData.entryFee).toLocaleString()} points</span> • 
                    Players: <span className="text-neon-pink">{gameSessionData.currentPlayers}/{gameSessionData.maxPlayers}</span>
                  </p>
                </div>
                
                {gameScore !== null && (
                  <div className="text-right">
                    <p className="text-sm text-gray-400">YOUR SCORE</p>
                    <p className="text-2xl font-arcade text-neon-green">{gameScore}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Game result message */}
          {gameResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-6 p-6 rounded-md text-center ${
                gameResult.success 
                  ? 'bg-green-900/30 border-2 border-neon-green' 
                  : 'bg-red-900/30 border-2 border-red-500'
              }`}
            >
              <h3 className={`text-2xl font-arcade mb-2 ${
                gameResult.success ? 'text-neon-green' : 'text-red-400'
              }`}>
                {gameResult.success ? 'VICTORY!' : 'GAME OVER'}
              </h3>
              <p className="text-white mb-4">{gameResult.message}</p>
              
              {gameResult.success && gameResult.winnings && (
                <div className="mb-4">
                  <p className="text-gray-300">Prize Pool:</p>
                  <p className="text-3xl font-arcade text-neon-pink">
                    {parseInt(gameResult.winnings).toLocaleString()} POINTS
                  </p>
                </div>
              )}
              
              {gameResult.success && gameSessionData?.roomId && (
                <button
                  onClick={() => handleClaimPrize(gameSessionData.roomId!)}
                  className="arcade-button-glow-green"
                >
                  CLAIM PRIZE
                </button>
              )}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeGame === 'flappy-bird' && (
              <FlappyBird onGameOver={handleGameOver} onStart={handleGameStart} />
            )}
            
            {activeGame === 'ai-challenge' && (
              <AIChallenge onGameOver={handleGameOver} onStart={handleGameStart} />
            )}
            
            {(activeGame === 'cyber-racer' || activeGame === 'memory-hacker') && (
              <div className="text-center py-16 bg-black/60 border-2 border-neon-blue rounded-lg">
                <h2 className="text-3xl font-arcade neon-text-pink mb-4">COMING SOON</h2>
                <p className="text-gray-300 mb-8">
                  This game is currently in development and will be available soon!
                </p>
                <button
                  onClick={resetGameSession}
                  className="arcade-button-blue"
                >
                  BACK TO GAMES
                </button>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex justify-between items-center flex-wrap gap-4"
          >
            <div>
              <h1 className="text-3xl font-arcade neon-text glitch-text" data-text="ARCADE GAMES">
                ARCADE GAMES
              </h1>
              <div className="h-1 w-40 bg-gradient-to-r from-neon-blue via-neon-pink to-transparent mt-2"></div>
            </div>
            
            {authenticated && (
              <button
                onClick={() => setShowRoomModal(true)}
                className="arcade-button-large"
              >
                + CREATE GAME ROOM
              </button>
            )}
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
          
          {/* Game Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {availableGames.map((game, index) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onClick={() => setActiveGame(game.id)}
              />
            ))}
          </div>
          
          {/* Active Rooms Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-2xl font-arcade neon-text-blue mb-6">ACTIVE ROOMS</h2>
            
            {authenticated ? (
              <>
                {loadingRooms ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="loading"></div>
                  </div>
                ) : activeRooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {activeRooms.map((room, index) => (
                      <RoomCard 
                        key={room.id} 
                        room={room} 
                        index={index}
                        onJoin={() => startJoinRoom(
                          room.id, 
                          room.type === 'PRIVATE'
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-black/60 border-2 border-gray-800 rounded-lg">
                    <h3 className="text-xl font-arcade text-neon-blue mb-4">NO ACTIVE ROOMS</h3>
                    <p className="text-gray-300 mb-8 max-w-md mx-auto">
                      There are no active game rooms at the moment. Create your own room to start playing!
                    </p>
                    <button
                      onClick={() => setShowRoomModal(true)}
                      className="arcade-button-green"
                    >
                      CREATE ROOM
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-black/60 border-2 border-gray-800 rounded-lg">
                <h3 className="text-xl font-arcade text-neon-pink mb-4">WALLET REQUIRED</h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  Connect your wallet to view active game rooms and compete with other players.
                </p>
                <button
                  onClick={() => login()}
                  className="arcade-button-green"
                >
                  CONNECT WALLET
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Create Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border-2 border-neon-blue rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-arcade text-neon-blue">CREATE GAME ROOM</h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {pointsBalance > 0 ? (
              <form onSubmit={handleCreateRoom}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      GAME TYPE
                    </label>
                    <select
                      value={roomSettings.gameType}
                      onChange={(e) => updateRoomSettings('gameType', e.target.value)}
                      className="w-full bg-black border-2 border-neon-green text-white p-2 rounded-md"
                    >
                      <option value="FlappyBird">FLAPPY BIRD</option>
                      <option value="AIChallenge">AI CHALLENGE</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      ENTRY FEE (POINTS)
                    </label>
                    <input
                      type="number"
                      value={roomSettings.entryFee}
                      onChange={(e) => updateRoomSettings('entryFee', e.target.value)}
                      min="10"
                      max={pointsBalance.toString()}
                      className="w-full bg-black border-2 border-neon-pink text-white p-2 rounded-md"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Your balance: {pointsBalance.toLocaleString()} points
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      MAX PLAYERS
                    </label>
                    <select
                      value={roomSettings.maxPlayers}
                      onChange={(e) => updateRoomSettings('maxPlayers', e.target.value)}
                      className="w-full bg-black border-2 border-neon-blue text-white p-2 rounded-md"
                    >
                      <option value="2">2 PLAYERS</option>
                      <option value="4">4 PLAYERS</option>
                      <option value="6">6 PLAYERS</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      ROOM TYPE
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roomType"
                          value="public"
                          checked={roomSettings.roomType === 'public'}
                          onChange={() => updateRoomSettings('roomType', 'public')}
                          className="mr-2"
                        />
                        <span className="text-sm">PUBLIC</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roomType"
                          value="private"
                          checked={roomSettings.roomType === 'private'}
                          onChange={() => updateRoomSettings('roomType', 'private')}
                          className="mr-2"
                        />
                        <span className="text-sm">PRIVATE</span>
                      </label>
                    </div>
                  </div>
                  
                  {roomSettings.roomType === 'private' && (
                    <div>
                      <label className="block text-sm font-arcade text-gray-300 mb-2">
                        INVITE CODE
                      </label>
                      <input
                        type="text"
                        value={roomSettings.inviteCode}
                        onChange={(e) => updateRoomSettings('inviteCode', e.target.value)}
                        className="w-full bg-black border-2 border-neon-green text-white p-2 rounded-md"
                        placeholder="Create a code for your friends"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="pt-4 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowRoomModal(false)}
                      className="arcade-button-pink"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={gameRoomLoading || parseInt(roomSettings.entryFee) > pointsBalance}
                      className={`arcade-button-green ${
                        gameRoomLoading || parseInt(roomSettings.entryFee) > pointsBalance 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {gameRoomLoading ? 'CREATING...' : 'CREATE ROOM'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center p-4">
                <p className="text-neon-pink text-lg mb-4">Insufficient Balance</p>
                <p className="text-gray-300 mb-6">
                  You need points to create a game room. Visit your dashboard to convert CORE tokens to points.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowRoomModal(false)}
                    className="arcade-button-red"
                  >
                    CLOSE
                  </button>
                  <Link href="/dashboard" className="arcade-button-blue">
                    GO TO DASHBOARD
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
      
      {/* Join Private Room Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border-2 border-neon-green rounded-lg p-6 w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-arcade text-neon-green">JOIN PRIVATE ROOM</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (joinRoomId) {
                handleJoinRoom(joinRoomId, joinInviteCode);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-arcade text-gray-300 mb-2">
                    INVITE CODE
                  </label>
                  <input
                    type="text"
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    className="w-full bg-black border-2 border-neon-green text-white p-2 rounded-md"
                    placeholder="Enter the room invite code"
                    required
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="arcade-button-pink"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={gameRoomLoading || !joinInviteCode}
                    className={`arcade-button-green ${
                      gameRoomLoading || !joinInviteCode 
                        ? 'opacity-50 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    {gameRoomLoading ? 'JOINING...' : 'JOIN ROOM'}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Game Card Component
function GameCard({ game, index, onClick }: { 
  game: {
    id: string;
    title: string;
    description: string;
    image: string;
    color: string;
    players: string;
    rating: number;
    comingSoon?: boolean;
  };
  index: number;
  onClick: () => void;
}) {
  const colorVariants = {
    blue: "border-neon-blue from-neon-blue/20 to-transparent",
    green: "border-neon-green from-neon-green/20 to-transparent",
    pink: "border-neon-pink from-neon-pink/20 to-transparent",
    purple: "border-neon-purple from-neon-purple/20 to-transparent"
  };
  
  const textVariants = {
    blue: "neon-text-blue",
    green: "neon-text-green",
    pink: "neon-text-pink",
    purple: "text-neon-purple"
  };
  
  const buttonVariants = {
    blue: "arcade-button-blue",
    green: "arcade-button-green",
    pink: "arcade-button-pink",
    purple: "bg-neon-purple text-white arcade-button-blue"
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className={`game-card p-1 bg-gradient-to-br ${colorVariants[game.color as keyof typeof colorVariants]} border-2`}
    >
      <div className="bg-black/80 backdrop-blur-sm p-6 h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-xl font-arcade ${textVariants[game.color as keyof typeof textVariants]}`}>{game.title}</h3>
          <div className="flex items-center">
            <div className="text-yellow-400 mr-1">★</div>
            <div className="text-sm font-bold">{game.rating.toFixed(1)}</div>
          </div>
        </div>
        
        <p className="text-gray-300 mb-6 text-sm leading-relaxed">{game.description}</p>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs text-gray-400">
            <span className="mr-1">👤</span> {game.players} active players
          </div>
          
          {game.comingSoon && (
            <div className="bg-black/70 border border-neon-pink text-neon-pink text-xs px-2 py-1 rounded">
              COMING SOON
            </div>
          )}
        </div>
        
        <div className="text-center">
          <button 
            onClick={onClick}
            className={`${buttonVariants[game.color as keyof typeof buttonVariants]} ${game.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={game.comingSoon}
          >
            {game.comingSoon ? 'COMING SOON' : 'PLAY NOW'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Room Card Component
function RoomCard({ room, index, onJoin }: {
  room: {
    id: number;
    game: string;
    entry: string;
    players: string;
    time: string;
    type: string;
  };
  index: number;
  onJoin: () => void;
}) {
  const typeColors = {
    'PUBLIC': 'text-neon-blue',
    'PRIVATE': 'text-neon-green',
    'TOURNAMENT': 'text-neon-pink'
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="p-1 bg-gradient-to-br from-gray-800/30 to-transparent border border-gray-700"
    >
      <div className="bg-black/80 backdrop-blur-sm p-4 h-full">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-sm font-arcade text-white">{room.game}</div>
            <div className="text-xs text-gray-500">Created {room.time}</div>
          </div>
          <div className={`text-xs font-arcade ${typeColors[room.type as keyof typeof typeColors]} px-2 py-1 border border-current`}>
            {room.type}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">ENTRY</div>
            <div className="text-sm font-arcade text-neon-pink">{parseInt(room.entry).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">PLAYERS</div>
            <div className="text-sm font-arcade text-white">{room.players}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">ROOM ID</div>
            <div className="text-sm font-arcade text-gray-300">#{room.id}</div>
          </div>
        </div>
        
        <button 
          onClick={onJoin}
          className="w-full py-2 text-xs font-arcade text-center bg-gradient-to-r from-neon-blue to-neon-purple text-black"
        >
          JOIN ROOM
        </button>
      </div>
    </motion.div>
  );
}
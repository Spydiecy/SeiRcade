'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import FlappyBird from '@/components/games/FlappyBird';
import AIChallenge from '@/components/games/AIChallenge';
import { usePrivy } from '@privy-io/react-auth';
import { useGameRoom, GameType, RoomType } from '@/hooks/useGameRoom';
import { usePointsManager } from '@/hooks/usePointsManager';
import { useSearchParams } from 'next/navigation';

export default function GamesPage() {
  const { authenticated, login } = usePrivy();
  const searchParams = useSearchParams();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
    entryFee: '50',
    maxPlayers: '2',
    gameType: 'FlappyBird',
    roomType: 'public',
    inviteCode: '',
    expirationTime: '3600'
  });
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Hooks for blockchain interaction
  const { 
    createRoom, 
    joinRoom, 
    submitScore, 
    getRoomDetails, 
    getActiveRooms,
    loading: gameRoomLoading, 
    error: gameRoomError 
  } = useGameRoom();
  
  const { 
    balance, 
    getBalance, 
    loading: pointsLoading 
  } = usePointsManager();
  
  // Fetch active rooms and check for room parameter in URL
  useEffect(() => {
    const fetchActiveRooms = async () => {
      // In a real implementation, this would fetch active rooms from the blockchain
      // For now, we'll use mock data from the UI
    };
    
    fetchActiveRooms();
    
    // Check if a specific room is requested in the URL
    const roomParam = searchParams?.get('room');
    if (roomParam) {
      const roomId = parseInt(roomParam);
      if (!isNaN(roomId)) {
        setActiveRoomId(roomId);
        // Get room details to determine which game to show
        fetchRoomDetails(roomId);
      }
    }
    
    // Fetch user's points balance
    if (authenticated) {
      getBalance();
    }
  }, [searchParams, authenticated]);
  
  // Fetch room details when a specific room is requested
  const fetchRoomDetails = async (roomId: number) => {
    try {
      const room = await getRoomDetails(roomId);
      if (room) {
        // Set the active game based on the room's game type
        if (room.gameType === GameType.FlappyBird) {
          setActiveGame('flappy-bird');
        } else if (room.gameType === GameType.AIChallenge) {
          setActiveGame('ai-challenge');
        }
      }
    } catch (error) {
      console.error("Error fetching room details:", error);
    }
  };

  // Handle game start
  const handleGameStart = () => {
    console.log('Game started');
    // In a real implementation, this might initialize game state on the blockchain
  };

  // Handle game over - submit score to blockchain
  const handleGameOver = async (score: number) => {
    console.log(`Game over with score: ${score}`);
    
    // If playing in a room, submit score to the blockchain
    if (activeRoomId && authenticated) {
      try {
        setNotification({
          type: 'success',
          message: 'Submitting your score to the blockchain...'
        });
        
        const result = await submitScore(activeRoomId, score);
        
        if (result) {
          setNotification({
            type: 'success',
            message: `Score of ${score} submitted successfully!`
          });
        } else {
          setNotification({
            type: 'error',
            message: 'Failed to submit score. Please try again.'
          });
        }
      } catch (error: any) {
        setNotification({
          type: 'error',
          message: error.message || 'An error occurred while submitting score'
        });
      }
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
      setNotification({
        type: 'success',
        message: 'Creating room on the blockchain...'
      });
      
      // Convert game type string to enum value
      const gameTypeValue = roomSettings.gameType === 'FlappyBird' ? GameType.FlappyBird : GameType.AIChallenge;
      
      // Convert room type string to enum value
      const roomTypeValue = roomSettings.roomType === 'public' ? RoomType.Public : RoomType.Private;
      
      // Create room on the blockchain
      const roomId = await createRoom(
        roomSettings.entryFee,
        parseInt(roomSettings.maxPlayers),
        gameTypeValue,
        roomTypeValue,
        roomSettings.inviteCode,
        parseInt(roomSettings.expirationTime)
      );
      
      if (roomId !== null) {
        setNotification({
          type: 'success',
          message: `Room created successfully with ID: ${roomId}`
        });
        
        // Set active room ID and determine which game to show
        setActiveRoomId(roomId);
        if (roomSettings.gameType === 'FlappyBird') {
          setActiveGame('flappy-bird');
        } else {
          setActiveGame('ai-challenge');
        }
        
        setShowRoomModal(false);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to create room. Please try again.'
        });
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'An error occurred while creating room'
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
      setNotification({
        type: 'success',
        message: 'Joining room on the blockchain...'
      });
      
      const result = await joinRoom(roomId, inviteCode);
      
      if (result) {
        setNotification({
          type: 'success',
          message: 'Successfully joined the room!'
        });
        
        // Set active room ID and fetch details to determine which game to show
        setActiveRoomId(roomId);
        fetchRoomDetails(roomId);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to join room. Please try again.'
        });
      }
    } catch (error: any) {
      setNotification({
        type: 'error',
        message: error.message || 'An error occurred while joining room'
      });
    }
  };

  // Available games data
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

  // Mock active rooms data - in a real implementation, this would come from the blockchain
  const activeRooms = [
    { id: 6758, game: 'FLAPPY BIRD', entry: '50', players: '2/4', time: '2 min ago', type: 'PUBLIC' },
    { id: 6754, game: 'AI CHALLENGE', entry: '100', players: '1/2', time: '5 min ago', type: 'PRIVATE' },
    { id: 6752, game: 'FLAPPY BIRD', entry: '200', players: '3/6', time: '8 min ago', type: 'TOURNAMENT' }
  ];

  return (
    <div className="pt-20 pb-16 arcade-bg min-h-screen">
      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md p-4 rounded-md ${
            notification.type === 'success' 
              ? 'bg-green-900/80 border border-neon-green text-neon-green' 
              : 'bg-red-900/80 border border-red-500 text-red-400'
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
      
      {activeGame ? (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-between items-center mb-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="arcade-button-blue"
              onClick={() => {
                setActiveGame(null);
                setActiveRoomId(null);
              }}
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
          
          {/* Display room info if playing in a room */}
          {activeRoomId && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-black/60 border border-neon-blue rounded-md"
            >
              <h3 className="font-arcade text-neon-blue mb-2">PLAYING IN ROOM #{activeRoomId}</h3>
              <p className="text-gray-300 text-sm">
                Your score will be automatically submitted to the blockchain when the game ends.
              </p>
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
                  onClick={() => setActiveGame(null)}
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
          
          {/* Points Balance Display */}
          {authenticated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-4 bg-black/60 border border-neon-green rounded-md flex justify-between items-center"
            >
              <div>
                <h3 className="font-arcade text-neon-green">YOUR POINTS BALANCE</h3>
                <p className="text-gray-300 text-sm">Use these points to enter game rooms and compete for prizes</p>
              </div>
              <div className="text-2xl font-arcade text-neon-green">
                {pointsLoading ? 'LOADING...' : balance.toLocaleString()}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {activeRooms.map((room, index) => (
                  <RoomCard 
                    key={room.id} 
                    room={room} 
                    index={index}
                    onJoin={() => handleJoinRoom(room.id)}
                  />
                ))}
              </div>
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
                    className="w-full bg-black border-2 border-neon-pink text-white p-2 rounded-md"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Your current balance: {balance.toLocaleString()} points
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
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-arcade text-gray-300 mb-2">
                    EXPIRATION TIME (SECONDS)
                  </label>
                  <select
                    value={roomSettings.expirationTime}
                    onChange={(e) => updateRoomSettings('expirationTime', e.target.value)}
                    className="w-full bg-black border-2 border-neon-purple text-white p-2 rounded-md"
                  >
                    <option value="1800">30 MINUTES</option>
                    <option value="3600">1 HOUR</option>
                    <option value="7200">2 HOURS</option>
                    <option value="14400">4 HOURS</option>
                  </select>
                </div>
                
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
                    className="arcade-button-green"
                    disabled={gameRoomLoading || parseInt(roomSettings.entryFee) > balance}
                  >
                    {gameRoomLoading ? 'CREATING...' : 'CREATE ROOM'}
                  </button>
                </div>
                
                {parseInt(roomSettings.entryFee) > balance && (
                  <p className="text-red-400 text-sm text-center">
                    Insufficient balance. You need {roomSettings.entryFee} points.
                  </p>
                )}
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
      className={`game-card p-1 bg-gradient-to-br ${colorVariants[game.color]} border-2`}
    >
      <div className="bg-black/80 backdrop-blur-sm p-6 h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-xl font-arcade ${textVariants[game.color]}`}>{game.title}</h3>
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
            className={`${buttonVariants[game.color]} ${game.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
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
    type: 'PUBLIC' | 'PRIVATE' | 'TOURNAMENT';
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
          <div className={`text-xs font-arcade ${typeColors[room.type]} px-2 py-1 border border-current`}>
            {room.type}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">ENTRY</div>
            <div className="text-sm font-arcade text-neon-pink">{room.entry}</div>
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
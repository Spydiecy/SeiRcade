'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import FlappyBird from '@/components/games/FlappyBird';
import AIChallenge from '@/components/games/AIChallenge';
import { usePrivy } from '@privy-io/react-auth';

export default function GamesPage() {
  const { authenticated, login } = usePrivy();
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

  // Handle game start
  const handleGameStart = () => {
    console.log('Game started');
    // In a real implementation, this would interact with the smart contract
  };

  // Handle game over
  const handleGameOver = (score: number) => {
    console.log(`Game over with score: ${score}`);
    // In a real implementation, this would submit the score to the smart contract
  };

  // Handle room creation
  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating room with settings:', roomSettings);
    // In a real implementation, this would call the smart contract to create a room
    setShowRoomModal(false);
  };

  // Update room settings
  const updateRoomSettings = (key: string, value: string) => {
    setRoomSettings({
      ...roomSettings,
      [key]: value
    });
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

  // Mock active rooms data
  const activeRooms = [
    { id: '6758', game: 'FLAPPY BIRD', entry: '50', players: '2/4', time: '2 min ago', type: 'PUBLIC' },
    { id: '6754', game: 'AI CHALLENGE', entry: '100', players: '1/2', time: '5 min ago', type: 'PRIVATE' },
    { id: '6752', game: 'FLAPPY BIRD', entry: '200', players: '3/6', time: '8 min ago', type: 'TOURNAMENT' }
  ];

  return (
    <div className="pt-20 pb-16 arcade-bg min-h-screen">
      {activeGame ? (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-between items-center mb-6">
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="arcade-button-blue"
              onClick={() => setActiveGame(null)}
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
                  <RoomCard key={room.id} room={room} index={index} />
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
                  >
                    CREATE ROOM
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
function RoomCard({ room, index }: {
  room: {
    id: string;
    game: string;
    entry: string;
    players: string;
    time: string;
    type: 'PUBLIC' | 'PRIVATE' | 'TOURNAMENT';
  };
  index: number;
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
        
        <button className="w-full py-2 text-xs font-arcade text-center bg-gradient-to-r from-neon-blue to-neon-purple text-black">
          JOIN ROOM
        </button>
      </div>
    </motion.div>
  );
}
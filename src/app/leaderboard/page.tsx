'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'earnings' | 'activity' | 'weekly'>('earnings');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<'allTime' | 'weekly' | 'monthly'>('allTime');
  const [gameFilter, setGameFilter] = useState<'all' | 'flappy' | 'ai' | 'cyber' | 'memory'>('all');

  // Mock data - would be fetched from contracts in production
  const topEarners = [
    { address: '0x1234...5678', earnings: '25,420', games: 42, winRate: '76.2%', badges: ['Flappy Bird', 'AI Challenge'], avatar: 'blue' },
    { address: '0xabcd...efgh', earnings: '18,750', games: 36, winRate: '69.4%', badges: ['AI Challenge'], avatar: 'green' },
    { address: '0x9876...5432', earnings: '15,320', games: 29, winRate: '58.6%', badges: ['Flappy Bird', 'Cyber Racer'], avatar: 'pink' },
    { address: '0xijkl...mnop', earnings: '12,840', games: 31, winRate: '54.8%', badges: [], avatar: 'purple' },
    { address: '0x4567...8901', earnings: '10,580', games: 25, winRate: '64.0%', badges: ['Memory Hacker'], avatar: 'blue' },
    { address: '0x2468...1357', earnings: '8,950', games: 22, winRate: '50.0%', badges: [], avatar: 'pink' },
    { address: '0xmnop...qrst', earnings: '7,640', games: 19, winRate: '47.4%', badges: ['Flappy Bird'], avatar: 'green' },
    { address: '0xuvwx...yzab', earnings: '6,280', games: 16, winRate: '62.5%', badges: [], avatar: 'blue' },
  ];

  const mostActive = [
    { address: '0xqrst...uvwx', games: 78, earnings: '9,840', winRate: '42.3%', badges: ['Memory Hacker', 'AI Challenge', 'Flappy Bird'], avatar: 'purple' },
    { address: '0x2345...6789', games: 65, earnings: '8,750', winRate: '38.5%', badges: ['Cyber Racer', 'Flappy Bird'], avatar: 'green' },
    { address: '0xyzab...cdef', games: 59, earnings: '12,380', winRate: '54.2%', badges: ['AI Challenge'], avatar: 'blue' },
    { address: '0x5678...9012', games: 54, earnings: '7,920', winRate: '40.7%', badges: [], avatar: 'pink' },
    { address: '0xghij...klmn', games: 51, earnings: '11,240', winRate: '49.0%', badges: [], avatar: 'purple' },
    { address: '0xcdef...ghij', games: 48, earnings: '5,240', winRate: '35.4%', badges: ['Flappy Bird'], avatar: 'green' },
    { address: '0xklmn...opqr', games: 45, earnings: '6,860', winRate: '44.4%', badges: [], avatar: 'blue' },
    { address: '0xstuw...xyz1', games: 42, earnings: '4,530', winRate: '33.3%', badges: [], avatar: 'pink' },
  ];

  const weeklyStars = [
    { address: '0xkkww...9012', games: 33, earnings: '12,720', winRate: '81.8%', badges: ['Flappy Bird', 'Weekly Star'], avatar: 'pink' },
    { address: '0xttxp...efgh', games: 29, earnings: '10,350', winRate: '72.4%', badges: ['AI Challenge', 'Weekly Star'], avatar: 'blue' },
    { address: '0xbblq...zypw', games: 24, earnings: '8,680', winRate: '66.7%', badges: ['Cyber Racer', 'Weekly Star'], avatar: 'green' },
    { address: '0xnngt...mlps', games: 26, earnings: '7,920', winRate: '61.5%', badges: ['Weekly Star'], avatar: 'purple' },
    { address: '0xjjux...kywn', games: 22, earnings: '6,480', winRate: '59.1%', badges: ['Memory Hacker', 'Weekly Star'], avatar: 'blue' },
    { address: '0xpqvb...cdef', games: 20, earnings: '5,940', winRate: '55.0%', badges: ['Weekly Star'], avatar: 'pink' },
  ];

  useEffect(() => {
    // Simulate loading for smooth animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter players based on search term and filters
  const getFilteredPlayers = () => {
    let players = [];
    
    if (activeTab === 'earnings') {
      players = topEarners;
    } else if (activeTab === 'activity') {
      players = mostActive;
    } else {
      players = weeklyStars;
    }
    
    // Apply search filter
    if (searchTerm) {
      players = players.filter(p => 
        p.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply game filter
    if (gameFilter !== 'all') {
      const gameMap = {
        'flappy': 'Flappy Bird',
        'ai': 'AI Challenge',
        'cyber': 'Cyber Racer',
        'memory': 'Memory Hacker'
      };
      
      players = players.filter(p => 
        p.badges.includes(gameMap[gameFilter])
      );
    }
    
    return players;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center arcade-bg">
        <div className="loading"></div>
      </div>
    );
  }

  function LeaderboardRow({ player, rank, isActive }: {
    player: {
      address: string;
      earnings: string;
      games: number;
      winRate: string;
      badges: string[];
      avatar: string;
    };
    rank: number;
    isActive: boolean;
  }) {
    // Determine badge styling based on rank
    const getRankBadge = (position: number) => {
      if (position === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black";
      if (position === 2) return "bg-gradient-to-r from-gray-300 to-gray-500 text-black";
      if (position === 3) return "bg-gradient-to-r from-amber-700 to-amber-900 text-white";
      return "bg-gray-800 text-gray-300";
    };
    
    // Avatar color
    const avatarColor = {
      'blue': "from-blue-500 to-blue-700",
      'green': "from-green-500 to-green-700",
      'pink': "from-pink-500 to-pink-700",
      'purple': "from-purple-500 to-purple-700"
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: rank * 0.05 }}
        className={`p-1 ${rank <= 3 ? 'bg-gradient-to-r from-gray-800/50 to-black/50' : ''} mb-4`}
      >
        <div className="bg-black/80 p-4 grid grid-cols-12 gap-3 items-center">
          <div className="col-span-1">
            <div className={`w-8 h-8 flex items-center justify-center font-arcade text-sm ${getRankBadge(rank)}`}>
              {rank}
            </div>
          </div>
          
          <div className="col-span-5 md:col-span-4">
            <div className="flex items-center">
              <div className={`w-6 h-6 bg-gradient-to-r ${avatarColor[player.avatar as keyof typeof avatarColor]} rounded-full mr-3`}></div>
              <div>
                <div className="font-arcade text-sm text-white">{player.address}</div>
                {player.badges.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {player.badges.map((badge, i) => (
                      <div key={i} className="text-xs px-1 bg-gray-800 text-neon-blue" title={badge}>
                        {badge.startsWith('Weekly') ? '⭐' : badge.charAt(0)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-span-3 md:col-span-3 text-center">
            {isActive ? (
              <div className="font-arcade text-sm neon-text-green">{player.games}</div>
            ) : (
              <div className="font-arcade text-sm neon-text-blue">{player.earnings}</div>
            )}
          </div>
          
          <div className="hidden md:block md:col-span-2 text-center">
            <div className="font-arcade text-sm text-yellow-400">{player.winRate}</div>
          </div>
          
          <div className="col-span-3 md:col-span-2 text-right">
            <button className="arcade-button-blue text-xs px-2 py-1">PROFILE</button>
          </div>
        </div>
      </motion.div>
    );
  }

  const filteredPlayers = getFilteredPlayers();

  return (
    <div className="pt-16 pb-16 arcade-bg min-h-screen">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-arcade neon-text glitch-text" data-text="LEADERBOARD">
            LEADERBOARD
          </h1>
          <div className="h-1 w-40 bg-gradient-to-r from-neon-blue via-neon-pink to-transparent mt-2"></div>
        </motion.div>
        
        {/* Search and filter section */}
        <div className="mb-8 bg-black/50 border border-gray-800 p-4 rounded">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="SEARCH PLAYERS..." 
                  className="w-full bg-gray-900 border border-neon-blue text-white py-2 px-4 font-arcade text-xs focus:outline-none focus:ring-2 focus:ring-neon-blue"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neon-blue">⌕</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <select 
                className="bg-gray-900 border border-neon-green text-white py-2 px-4 font-arcade text-xs focus:outline-none focus:ring-2 focus:ring-neon-green"
                value={gameFilter}
                onChange={(e) => setGameFilter(e.target.value as any)}
              >
                <option value="all">ALL GAMES</option>
                <option value="flappy">FLAPPY BIRD</option>
                <option value="ai">AI CHALLENGE</option>
                <option value="cyber">CYBER RACER</option>
                <option value="memory">MEMORY HACKER</option>
              </select>
              
              <select 
                className="bg-gray-900 border border-neon-pink text-white py-2 px-4 font-arcade text-xs focus:outline-none focus:ring-2 focus:ring-neon-pink"
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
              >
                <option value="allTime">ALL TIME</option>
                <option value="monthly">MONTHLY</option>
                <option value="weekly">WEEKLY</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="flex border-b border-gray-800 mb-8">
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'earnings' 
              ? 'text-neon-blue border-neon-blue' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('earnings')}
          >
            TOP EARNERS
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'activity' 
              ? 'text-neon-green border-neon-green' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('activity')}
          >
            MOST ACTIVE
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'weekly' 
              ? 'text-neon-pink border-neon-pink' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('weekly')}
          >
            WEEKLY STARS
          </button>
        </div>
        
        {/* Leaderboard headers */}
        <div className="grid grid-cols-12 gap-3 px-4 mb-4 text-gray-500 text-xs font-bold">
          <div className="col-span-1">RANK</div>
          <div className="col-span-5 md:col-span-4">PLAYER</div>
          <div className="col-span-3 md:col-span-3 text-center">
            {activeTab === 'earnings' ? 'EARNINGS' : 'GAMES'}
          </div>
          <div className="hidden md:block md:col-span-2 text-center">WIN RATE</div>
          <div className="col-span-3 md:col-span-2 text-right">ACTION</div>
        </div>
        
        {/* Leaderboard contents */}
        <div className="mb-8">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player, index) => (
              <LeaderboardRow 
                key={player.address} 
                player={player} 
                rank={index + 1} 
                isActive={activeTab === 'activity' || activeTab === 'weekly'} 
              />
            ))
          ) : (
            <div className="text-center py-10 bg-black/50 border border-gray-800">
              <p className="text-gray-400 text-lg">No players match your search criteria</p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setGameFilter('all');
                }}
                className="mt-4 arcade-button-blue"
              >
                RESET FILTERS
              </button>
            </div>
          )}
        </div>
        
        {/* Platform stats */}
        <div className="bg-black/50 border border-gray-800 p-6 rounded">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-arcade text-gray-400 mb-2">TOTAL PLAYERS</div>
              <div className="text-2xl font-arcade neon-text-blue">1,248</div>
            </div>
            <div>
              <div className="text-sm font-arcade text-gray-400 mb-2">TOTAL GAMES PLAYED</div>
              <div className="text-2xl font-arcade neon-text-green">8,472</div>
            </div>
            <div>
              <div className="text-sm font-arcade text-gray-400 mb-2">TOTAL PRIZE POOL</div>
              <div className="text-2xl font-arcade neon-text-pink">428,500</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm cyberpunk-text mb-2">
              Leaderboards update every 24 hours. Play more games to climb the ranks!
            </p>
            <div className="text-xs text-gray-500">Last updated: 03:42:16 ago</div>
          </div>
        </div>
      </div>
    </div>
  );
}
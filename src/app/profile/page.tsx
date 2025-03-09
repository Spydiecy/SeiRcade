'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ProfilePage() {
  const { ready, authenticated, user, login } = usePrivy();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'achievements'>('stats');

  // Mock player data - would be fetched from the blockchain in production
  const playerData = {
    address: '0x1234...5678',
    username: 'CryptoArcader',
    level: 8,
    xp: 4250,
    nextLevelXp: 6500,
    joinDate: '2 months ago',
    totalGames: 142,
    gamesWon: 98,
    winRate: '69.01%',
    earnings: '25,420',
    highestScore: 864,
    badges: [
      { name: 'Flappy Master', icon: '🐦', description: 'Score over 500 in Flappy Bird' },
      { name: 'AI Whisperer', icon: '🤖', description: 'Win 10 games of AI Challenge' },
      { name: 'Early Adopter', icon: '🚀', description: 'Joined during platform launch' },
      { name: 'Winning Streak', icon: '🔥', description: 'Won 5 games in a row' }
    ],
    recentGames: [
      { id: '2876', game: 'Flappy Bird', score: '764', result: 'win', reward: '320', date: '2 hours ago' },
      { id: '2871', game: 'AI Challenge', score: '98', result: 'win', reward: '450', date: '5 hours ago' },
      { id: '2868', game: 'Cyber Racer', score: '1240', result: 'loss', reward: '0', date: '1 day ago' },
      { id: '2864', game: 'Memory Hacker', score: '15', result: 'win', reward: '280', date: '1 day ago' },
      { id: '2859', game: 'Flappy Bird', score: '512', result: 'win', reward: '300', date: '2 days ago' },
      { id: '2856', game: 'AI Challenge', score: '87', result: 'loss', reward: '0', date: '2 days ago' }
    ],
    achievements: [
      { name: 'First Win', description: 'Win your first game', completed: true, date: '2 months ago', xp: 100 },
      { name: 'Spending Spree', description: 'Convert 1000 tokens to platform points', completed: true, date: '2 months ago', xp: 150 },
      { name: 'Bird Whisperer', description: 'Score 500+ in Flappy Bird', completed: true, date: '1 month ago', xp: 200 },
      { name: 'Room Creator', description: 'Create your first game room', completed: true, date: '2 months ago', xp: 100 },
      { name: 'Tournament Winner', description: 'Win an official tournament', completed: false, progress: '0/1', xp: 500 },
      { name: 'High Roller', description: 'Enter a game with 1000+ entry fee', completed: false, progress: '0/1', xp: 300 },
      { name: 'Perfect Record', description: 'Win 10 games in a row', completed: false, progress: '5/10', xp: 400 },
      { name: 'Diverse Player', description: 'Play all available games', completed: false, progress: '3/4', xp: 250 }
    ]
  };

  useEffect(() => {
    // Simulate loading for smooth animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

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
            Connect your wallet to view your player profile and statistics.
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
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-black/50 border border-neon-blue p-6 rounded-md">
            {/* Avatar and Basic Info */}
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 border-4 border-neon-blue flex items-center justify-center mb-4">
                <span className="text-3xl">👾</span>
              </div>
              <h2 className="text-xl font-arcade neon-text-blue mb-1">{playerData.username}</h2>
              <p className="text-gray-400 text-sm mb-2">{playerData.address}</p>
              <p className="text-gray-500 text-xs">Joined {playerData.joinDate}</p>
            </div>
            
            {/* Stats Overview */}
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                <p className="text-xs text-gray-400 mb-1">LEVEL</p>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-2xl font-arcade neon-text-green">{playerData.level}</p>
                  <div className="text-sm text-gray-400">{Math.round((playerData.xp / playerData.nextLevelXp) * 100)}%</div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-green to-neon-blue" 
                    style={{ width: `${(playerData.xp / playerData.nextLevelXp) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 text-xs text-right text-gray-500">
                  {playerData.xp} / {playerData.nextLevelXp} XP
                </div>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                <p className="text-xs text-gray-400 mb-1">GAMES</p>
                <p className="text-2xl font-arcade neon-text-blue">{playerData.totalGames}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Win rate:</span>
                  <span className="text-xs text-neon-blue">{playerData.winRate}</span>
                </div>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                <p className="text-xs text-gray-400 mb-1">EARNINGS</p>
                <p className="text-2xl font-arcade neon-text-pink">{playerData.earnings}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Best game:</span>
                  <span className="text-xs text-neon-pink">450</span>
                </div>
              </div>
              
              <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                <p className="text-xs text-gray-400 mb-1">HIGH SCORE</p>
                <p className="text-2xl font-arcade neon-text-purple">{playerData.highestScore}</p>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">Game:</span>
                  <span className="text-xs text-neon-purple">Cyber Racer</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 mb-8">
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'stats' 
              ? 'text-neon-blue border-neon-blue' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('stats')}
          >
            STATISTICS
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'history' 
              ? 'text-neon-green border-neon-green' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('history')}
          >
            GAME HISTORY
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'achievements' 
              ? 'text-neon-pink border-neon-pink' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('achievements')}
          >
            ACHIEVEMENTS
          </button>
        </div>
        
        {/* Statistics Tab Content */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Per Game Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-black/50 border border-gray-800 rounded-md p-6"
            >
              <h3 className="text-xl font-arcade text-white mb-6">Game Performance</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-arcade">Flappy Bird</span>
                    <span className="text-sm text-neon-blue">73% Win Rate</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-blue" style={{ width: '73%' }}></div>
                  </div>
                  <div className="mt-1 grid grid-cols-3 text-xs text-gray-400">
                    <div>Games: 52</div>
                    <div>Wins: 38</div>
                    <div>Best: 764</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-arcade">AI Challenge</span>
                    <span className="text-sm text-neon-green">65% Win Rate</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-green" style={{ width: '65%' }}></div>
                  </div>
                  <div className="mt-1 grid grid-cols-3 text-xs text-gray-400">
                    <div>Games: 46</div>
                    <div>Wins: 30</div>
                    <div>Best: 98</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-arcade">Cyber Racer</span>
                    <span className="text-sm text-neon-pink">58% Win Rate</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-pink" style={{ width: '58%' }}></div>
                  </div>
                  <div className="mt-1 grid grid-cols-3 text-xs text-gray-400">
                    <div>Games: 31</div>
                    <div>Wins: 18</div>
                    <div>Best: 1240</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-arcade">Memory Hacker</span>
                    <span className="text-sm text-neon-purple">92% Win Rate</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-neon-purple" style={{ width: '92%' }}></div>
                  </div>
                  <div className="mt-1 grid grid-cols-3 text-xs text-gray-400">
                    <div>Games: 13</div>
                    <div>Wins: 12</div>
                    <div>Best: 22</div>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-black/50 border border-gray-800 rounded-md p-6"
            >
              <h3 className="text-xl font-arcade text-white mb-6">Badges</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {playerData.badges.map((badge, index) => (
                  <div key={index} className="bg-gray-900/80 border border-gray-800 p-4 rounded-md">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-3">{badge.icon}</span>
                      <span className="font-arcade text-sm text-neon-blue">{badge.name}</span>
                    </div>
                    <p className="text-xs text-gray-400">{badge.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <Link href="/achievements" className="arcade-button-blue">
                  VIEW ALL BADGES
                </Link>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Game History Tab Content */}
        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/50 border border-gray-800 rounded-md p-6"
          >
            <h3 className="text-xl font-arcade text-white mb-6">Recent Games</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-arcade text-gray-400">ID</th>
                    <th className="py-3 px-4 text-left text-xs font-arcade text-gray-400">GAME</th>
                    <th className="py-3 px-4 text-center text-xs font-arcade text-gray-400">SCORE</th>
                    <th className="py-3 px-4 text-center text-xs font-arcade text-gray-400">RESULT</th>
                    <th className="py-3 px-4 text-center text-xs font-arcade text-gray-400">REWARD</th>
                    <th className="py-3 px-4 text-right text-xs font-arcade text-gray-400">DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {playerData.recentGames.map((game, index) => (
                    <tr key={game.id} className="border-b border-gray-800">
                      <td className="py-4 px-4 text-xs font-arcade">#{game.id}</td>
                      <td className="py-4 px-4 text-sm">{game.game}</td>
                      <td className="py-4 px-4 text-center text-sm font-arcade text-white">{game.score}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${
                          game.result === 'win' 
                            ? 'bg-green-900/30 text-neon-green' 
                            : 'bg-red-900/30 text-red-400'
                        }`}>
                          {game.result.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-sm font-arcade text-neon-pink">{game.reward}</td>
                      <td className="py-4 px-4 text-right text-xs text-gray-400">{game.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-center">
              <button className="arcade-button-green">
                LOAD MORE GAMES
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Achievements Tab Content */}
        {activeTab === 'achievements' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/50 border border-gray-800 rounded-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-arcade text-white">Achievements</h3>
              <div className="pixel-box px-3 py-1">
                <span className="text-neon-green text-sm">{playerData.achievements.filter(a => a.completed).length}/{playerData.achievements.length} COMPLETED</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {playerData.achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`border ${achievement.completed ? 'border-neon-green bg-green-900/10' : 'border-gray-700 bg-gray-900/30'} p-4 rounded-md`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className={`text-sm font-arcade ${achievement.completed ? 'text-neon-green' : 'text-white'}`}>
                      {achievement.name}
                    </h4>
                    <div className="text-xs font-bold text-gray-400">
                      +{achievement.xp} XP
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2">{achievement.description}</p>
                  
                  {achievement.completed ? (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neon-green">✓ COMPLETED</span>
                      <span className="text-xs text-gray-500">{achievement.date}</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">{achievement.progress}</span>
                      <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gray-600" 
                          style={{ 
                            width: `${achievement.progress ? (parseInt(achievement.progress.split('/')[0]) / parseInt(achievement.progress.split('/')[1]) * 100) : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
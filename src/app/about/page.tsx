'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AboutPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'platform' | 'team' | 'faq'>('platform');

  useEffect(() => {
    // Simulate loading for smooth animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Sample team data
  const teamMembers = [
    { name: 'Alex Crypto', role: 'Founder & Lead Developer', avatar: '👨‍💻', description: 'Blockchain expert with a passion for gaming' },
    { name: 'Samantha Block', role: 'Game Designer', avatar: '👩‍🎨', description: 'Creator of our unique gaming experiences' },
    { name: 'Mike Token', role: 'Smart Contract Engineer', avatar: '👨‍🔧', description: 'Ensures our platform runs securely on-chain' },
    { name: 'Lisa Dev', role: 'Frontend Developer', avatar: '👩‍💻', description: 'Crafts our immersive arcade interface' }
  ];

  // Sample FAQ data
  const faqItems = [
    { 
      question: 'What is CoreCade?', 
      answer: 'CoreCade is a play-to-earn gaming platform built on the Core blockchain. Players can compete in skill-based mini-games and earn real rewards in the form of tokens.' 
    },
    { 
      question: 'How do I get started?', 
      answer: 'Connect your wallet, convert some Core tokens into platform points, and start playing games! You\'ll earn rewards based on your performance and skill.' 
    },
    { 
      question: 'Is CoreCade secure?', 
      answer: 'Yes, CoreCade is built on secure smart contracts that have been thoroughly audited. All game outcomes and prize distributions are transparent and verifiable on-chain.' 
    },
    { 
      question: 'What games are available?', 
      answer: 'Currently, we offer Flappy Bird, AI Challenge, Cyber Racer, and Memory Hacker. We\'re constantly working on adding new games and experiences.' 
    },
    { 
      question: 'How do rewards work?', 
      answer: 'When you win a game, you receive a prize in the form of platform points. These can be converted back to Core tokens and withdrawn to your wallet.' 
    },
    { 
      question: 'Can I create my own game rooms?', 
      answer: 'Absolutely! You can create custom game rooms with your preferred entry fee, player limit, and game type. Invite friends or open it to the public.' 
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
    <div className="pt-16 pb-16 arcade-bg min-h-screen">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-arcade neon-text glitch-text" data-text="ABOUT CORECADE">
            ABOUT CORECADE
          </h1>
          <div className="h-1 w-64 bg-gradient-to-r from-neon-blue via-neon-pink to-transparent mt-2"></div>
        </motion.div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-800 mb-8">
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'platform' 
              ? 'text-neon-blue border-neon-blue' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('platform')}
          >
            THE PLATFORM
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'team' 
              ? 'text-neon-green border-neon-green' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('team')}
          >
            OUR TEAM
          </button>
          <button
            className={`py-3 px-6 font-arcade text-sm border-b-2 transition-all duration-300 ${
              activeTab === 'faq' 
              ? 'text-neon-pink border-neon-pink' 
              : 'text-gray-500 border-transparent'
            }`}
            onClick={() => setActiveTab('faq')}
          >
            FAQ
          </button>
        </div>
        
        {/* Platform Tab Content */}
        {activeTab === 'platform' && (
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-black/50 border border-gray-800 rounded-md p-6">
                <h2 className="text-2xl font-arcade neon-text-blue mb-4">Our Mission</h2>
                <div className="cyberpunk-text text-gray-300 space-y-4 leading-relaxed">
                  <p>
                    CoreCade was created with a simple yet powerful vision: to combine the nostalgic joy of arcade gaming with the innovative potential of blockchain technology. Our mission is to build a thriving play-to-earn ecosystem where skill is rewarded and fun is paramount.
                  </p>
                  <p>
                    We believe gaming should be accessible, engaging, and rewarding. By leveraging the Core blockchain, we've created a platform where players can compete in skill-based mini-games and earn real value based on their performance.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-black/50 border border-gray-800 rounded-md p-6">
                <h2 className="text-2xl font-arcade neon-text-green mb-4">How It Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                    <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-neon-blue flex items-center justify-center mb-3 mx-auto">
                      <span className="text-2xl">💰</span>
                    </div>
                    <h3 className="font-arcade text-neon-blue text-center mb-2">Deposit</h3>
                    <p className="text-sm text-gray-400 text-center">Convert Core tokens into platform points that you can use to enter games and competitions.</p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                    <div className="w-12 h-12 rounded-full bg-green-900/30 border border-neon-green flex items-center justify-center mb-3 mx-auto">
                      <span className="text-2xl">🎮</span>
                    </div>
                    <h3 className="font-arcade text-neon-green text-center mb-2">Play</h3>
                    <p className="text-sm text-gray-400 text-center">Join game rooms or create your own. Compete against other players in skill-based mini-games.</p>
                  </div>
                  
                  <div className="bg-gray-900/50 p-4 rounded-md border border-gray-800">
                    <div className="w-12 h-12 rounded-full bg-pink-900/30 border border-neon-pink flex items-center justify-center mb-3 mx-auto">
                      <span className="text-2xl">🏆</span>
                    </div>
                    <h3 className="font-arcade text-neon-pink text-center mb-2">Earn</h3>
                    <p className="text-sm text-gray-400 text-center">Win games to earn points which can be converted back to Core tokens and withdrawn.</p>
                  </div>
                </div>
                
                <div className="cyberpunk-text text-gray-300 space-y-4 leading-relaxed">
                  <p>
                    Our platform uses smart contracts to ensure fair play and transparent prize distribution. All game outcomes and transactions are recorded on the Core blockchain, making the entire process trustless and verifiable.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-black/50 border border-gray-800 rounded-md p-6">
                <h2 className="text-2xl font-arcade neon-text-pink mb-4">Our Games</h2>
                <div className="cyberpunk-text text-gray-300 space-y-4 leading-relaxed">
                  <p>
                    CoreCade features a growing collection of skill-based mini-games, each with its own unique gameplay and challenge. Our games are designed to be easy to learn but difficult to master, rewarding practice and skill development.
                  </p>
                  <p>
                    From classic arcade-inspired titles to innovative new concepts, our game library offers something for every type of player. And we're constantly working on adding new experiences to keep the platform fresh and exciting.
                  </p>
                </div>
                
                <div className="mt-6 text-center">
                  <Link href="/games" className="arcade-button-glow-blue">
                    EXPLORE OUR GAMES
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
        {/* Team Tab Content */}
        {activeTab === 'team' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/50 border border-gray-800 rounded-md p-6"
          >
            <h2 className="text-2xl font-arcade neon-text-green mb-8 text-center">Meet The Team</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={index}
                  className="bg-gray-900/50 border border-gray-800 rounded-md p-6 flex items-start"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-3xl">{member.avatar}</span>
                  </div>
                  <div>
                    <h3 className="font-arcade text-neon-blue text-lg mb-1">{member.name}</h3>
                    <p className="text-neon-pink text-sm mb-2">{member.role}</p>
                    <p className="text-gray-400 text-sm">{member.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-gray-900/30 border border-gray-800 rounded-md">
              <h3 className="font-arcade text-white text-center mb-4">Join Our Team</h3>
              <p className="text-gray-400 text-center mb-6">
                We're always looking for talented individuals who are passionate about blockchain, gaming, and creating amazing experiences.
              </p>
              <div className="text-center">
                <a href="mailto:careers@corecade.io" className="arcade-button-green">
                  VIEW OPEN POSITIONS
                </a>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* FAQ Tab Content */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-black/50 border border-gray-800 rounded-md p-6"
          >
            <h2 className="text-2xl font-arcade neon-text-pink mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <FaqItem 
                  key={index}
                  question={item.question}
                  answer={item.answer}
                  index={index}
                />
              ))}
            </div>
            
            <div className="mt-8 p-6 bg-gray-900/30 border border-gray-800 rounded-md text-center">
              <h3 className="font-arcade text-white mb-4">Still Have Questions?</h3>
              <p className="text-gray-400 mb-6">
                Our support team is always here to help. Reach out with any questions or concerns.
              </p>
              <a href="mailto:support@corecade.io" className="arcade-button-pink">
                CONTACT SUPPORT
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// FAQ Item Component
function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="border border-gray-800 rounded-md overflow-hidden"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-4 bg-gray-900/50 flex justify-between items-center hover:bg-gray-900/80 transition-colors"
      >
        <span className="font-arcade text-white">{question}</span>
        <span className={`text-neon-pink transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-black/30 text-gray-300 cyberpunk-text leading-relaxed"
        >
          {answer}
        </motion.div>
      )}
    </motion.div>
  );
}
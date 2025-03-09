'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { login, authenticated, ready, user } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for smooth animations
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center arcade-bg">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen arcade-bg overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Scanner line effect */}
        <div className="scanner-line"></div>
        
        <div className="container mx-auto px-6 relative z-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-5xl md:text-7xl font-arcade arcade-hero-text mb-8"
            >
              PLAY TO EARN
            </motion.h1>
            
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-12 text-xl md:text-2xl pixel-text"
            >
              <span className="text-neon-blue">COMPETE</span> • <span className="text-neon-green">WIN</span> • <span className="text-neon-pink">EARN</span>
            </motion.div>
            
            <motion.p
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="mb-12 text-gray-300 text-lg cyberpunk-text max-w-2xl mx-auto leading-relaxed"
            >
              CoreCade is a futuristic gaming platform where your skills earn you real rewards on the Core blockchain.
            </motion.p>
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-6 justify-center"
            >
              <Link href="/games" className="arcade-button-glow-blue">
                START PLAYING
              </Link>
              <Link href="/leaderboard" className="arcade-button-glow-pink">
                LEADERBOARD
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Floating game elements */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ 
              y: [0, -15, 0],
              x: [0, 10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ 
              duration: 6, 
              ease: "easeInOut", 
              repeat: Infinity,
              repeatType: "reverse" 
            }}
            className="absolute top-[15%] left-[15%] w-16 h-16 pixel-element rotate-12"
          >
            <div className="w-full h-full bg-neon-blue/30 border-2 border-neon-blue pixel-box"></div>
          </motion.div>
          
          <motion.div
            animate={{ 
              y: [0, 20, 0],
              x: [0, -5, 0],
              rotate: [0, -10, 0],
            }}
            transition={{ 
              duration: 7, 
              ease: "easeInOut", 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 1
            }}
            className="absolute top-[25%] right-[20%] w-20 h-20 pixel-element -rotate-12"
          >
            <div className="w-full h-full bg-neon-pink/30 border-2 border-neon-pink pixel-box"></div>
          </motion.div>
          
          {/* Add a floating controller icon */}
          <motion.div
            animate={{ 
              y: [0, 10, 0],
              rotate: [0, 3, 0],
            }}
            transition={{ 
              duration: 5, 
              ease: "easeInOut", 
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.5
            }}
            className="absolute bottom-[20%] right-[30%] w-24 h-16 hidden md:block"
          >
            <div className="controller-icon"></div>
          </motion.div>
          
          {/* Add a floating coin */}
          <motion.div
            animate={{ 
              y: [0, -12, 0],
              rotate: [0, 360, 720],
            }}
            transition={{ 
              y: {
                duration: 4,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              },
              rotate: {
                duration: 10,
                ease: "linear",
                repeat: Infinity
              }
            }}
            className="absolute top-[15%] right-[35%] w-12 h-12 hidden md:block"
          >
            <div className="coin-icon"></div>
          </motion.div>
        </div>
        
        {/* Grid overlay effect */}
        <div className="grid-overlay"></div>
      </section>

      {/* Featured Games */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-arcade neon-text-blue mb-16 text-center"
          >
            FEATURED GAMES
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <GameCard 
              title="FLAPPY BIRD"
              description="Navigate through obstacles and compete for the highest score in this addictive arcade classic."
              color="blue"
              players="248"
              delay={0.3}
              playTime="2-3 min"
            />
            <GameCard 
              title="AI CHALLENGE"
              description="Try to trick the AI into saying a specific word within the time limit. Test your creativity!"
              color="green"
              players="192"
              delay={0.6}
              playTime="1-2 min"
            />
          </div>
        </div>
        
        {/* Diagonal divider */}
        <div className="diagonal-divider"></div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative bg-black/50">
        <div className="container mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-arcade neon-text-pink mb-16 text-center"
          >
            HOW IT WORKS
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <StepCard 
              number="01"
              title="DEPOSIT"
              description="Convert Core tokens into platform points"
              color="blue"
              delay={0.3}
              icon="wallet"
            />
            <StepCard 
              number="02"
              title="COMPETE"
              description="Join game rooms and showcase your skills"
              color="green"
              delay={0.6}
              icon="controller"
            />
            <StepCard 
              number="03"
              title="EARN"
              description="Win games and claim your rewards"
              color="pink"
              delay={0.9}
              icon="prize"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-arcade neon-text-blue mb-2">1,248</div>
              <div className="text-sm font-arcade text-gray-400">ACTIVE PLAYERS</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-arcade neon-text-green mb-2">8,472</div>
              <div className="text-sm font-arcade text-gray-400">GAMES PLAYED</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-arcade neon-text-pink mb-2">428K</div>
              <div className="text-sm font-arcade text-gray-400">TOKENS EARNED</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-arcade neon-text-purple mb-2">4</div>
              <div className="text-sm font-arcade text-gray-400">ARCADE GAMES</div>
            </motion.div>
          </div>
        </div>
        
        {/* Animated lines background */}
        <div className="animated-lines"></div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-3xl md:text-4xl font-arcade arcade-hero-text mb-8"
          >
            READY TO PLAY?
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <button 
              className="hero-button bg-gradient-to-r from-neon-blue to-neon-pink text-black font-arcade text-lg py-4 px-12 rounded-lg shadow-lg hover:shadow-xl transform transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={authenticated ? 
                () => router.push('/games') : 
                () => login()
              }
              disabled={!ready}
            >
              {authenticated ? 'PLAY NOW' : 'CONNECT WALLET'}
            </button>
          </motion.div>
        </div>
        
        {/* Pixelated footer effect */}
        <div className="pixel-footer"></div>
      </section>
    </div>
  );
}

// Game Card Component - Embedded within the Home page
function GameCard({ title, description, color, players, delay, playTime }: { 
  title: string;
  description: string;
  color: 'blue' | 'green' | 'pink';
  players: string;
  delay: number;
  playTime: string;
}) {
  // Create URL-friendly slug from title
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  
  const colorVariants = {
    blue: "border-neon-blue from-neon-blue/20 to-transparent",
    green: "border-neon-green from-neon-green/20 to-transparent",
    pink: "border-neon-pink from-neon-pink/20 to-transparent",
  };
  
  const textVariants = {
    blue: "neon-text-blue",
    green: "neon-text-green",
    pink: "neon-text-pink",
  };
  
  const buttonVariants = {
    blue: "arcade-button-blue",
    green: "arcade-button-green",
    pink: "arcade-button-pink",
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: `0 0 25px rgba(var(--${color === 'blue' ? 'neon-blue' : color === 'green' ? 'neon-green' : 'neon-pink'}-rgb), 0.5)`,
        transition: { duration: 0.3 }
      }}
      className={`game-card p-1 bg-gradient-to-br ${colorVariants[color]} border-2`}
    >
      <div className="bg-black/80 backdrop-blur-sm p-6 h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-xl font-arcade ${textVariants[color]}`}>{title}</h3>
          
          <div className="pixel-box px-2 py-1 text-xs">
            <span className="mr-1">⏱️</span> {playTime}
          </div>
        </div>
        
        <p className="text-gray-300 mb-6 text-sm leading-relaxed cyberpunk-text">{description}</p>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs text-gray-400">
            <span className="mr-1">👤</span> {players} active players
          </div>
          
          <div className="flex space-x-1">
            <span className="w-2 h-2 rounded-full bg-neon-green"></span>
            <span className="w-2 h-2 rounded-full bg-neon-green"></span>
            <span className="w-2 h-2 rounded-full bg-neon-green"></span>
            <span className="w-2 h-2 rounded-full bg-neon-green opacity-30"></span>
            <span className="w-2 h-2 rounded-full bg-neon-green opacity-30"></span>
          </div>
        </div>
        
        <div className="text-center">
          <Link href={`/games/${slug}`} className={buttonVariants[color]}>
            PLAY NOW
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// Step Card Component - Embedded within the Home page
function StepCard({ number, title, description, color, delay, icon }: {
  number: string;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'pink';
  delay: number;
  icon: 'wallet' | 'controller' | 'prize';
}) {
  const colorVariants = {
    blue: "border-neon-blue from-neon-blue/20 to-transparent neon-text-blue",
    green: "border-neon-green from-neon-green/20 to-transparent neon-text-green",
    pink: "border-neon-pink from-neon-pink/20 to-transparent neon-text-pink",
  };
  
  const iconElements = {
    wallet: (
      <div className="w-12 h-12 mx-auto mb-4 icon-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6h-4l-2-2H8L6 6H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"></path>
        </svg>
      </div>
    ),
    controller: (
      <div className="w-12 h-12 mx-auto mb-4 icon-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="11" width="12" height="8" rx="2"></rect>
          <path d="M12 17v-6M8 13h8"></path>
        </svg>
      </div>
    ),
    prize: (
      <div className="w-12 h-12 mx-auto mb-4 icon-glow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 15c3.314 0 6-2.686 6-6V3.5H6V9c0 3.314 2.686 6 6 6z"></path>
          <path d="M15 9c0 1.657-1.343 3-3 3s-3-1.343-3-3V1.5H6v12l3 5h6l3-5v-12h-3V9z"></path>
        </svg>
      </div>
    )
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay }}
      className={`step-card border-2 ${colorVariants[color]} bg-gradient-to-br p-1`}
    >
      <div className="bg-black/80 backdrop-blur-sm p-6 h-full text-center relative">
        <div className={`absolute top-0 left-0 m-2 w-8 h-8 flex items-center justify-center border-2 ${color === 'blue' ? 'border-neon-blue' : color === 'green' ? 'border-neon-green' : 'border-neon-pink'}`}>
          <span className={`text-xl font-arcade ${colorVariants[color]}`}>{number}</span>
        </div>
        
        <div className={`text-3xl ${colorVariants[color]}`}>
          {iconElements[icon]}
        </div>
        
        <h4 className="text-xl font-arcade text-white mb-3">{title}</h4>
        <p className="text-gray-300 cyberpunk-text">{description}</p>
      </div>
    </motion.div>
  );
}
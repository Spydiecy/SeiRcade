'use client';

import MainLayout from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Image from 'next/image';

export default function Home() {
  const { login, authenticated } = usePrivy();
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Star background */}
        <div className="star-background absolute inset-0 z-0"></div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 z-10"></div>
        
        <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col items-center justify-center text-center relative z-20">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl md:text-6xl font-arcade text-white mb-6 leading-tight"
          >
            <span className="text-blue-400">Play</span>.
            <span className="text-purple-400">Compete</span>.
            <span className="text-pink-400">Earn</span>.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mb-10"
          >
            CoreCade is a play-to-earn gaming platform where your skills earn you real rewards on the Core blockchain.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/games" className="btn-arcade-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700">
              Play Now
            </Link>
            <Link href="/leaderboard" className="btn-arcade-lg bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700">
              Leaderboard
            </Link>
          </motion.div>
        </section>

        <section className="container mx-auto px-4 py-16 relative z-20">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="text-3xl font-arcade text-white text-center mb-12"
          >
            Featured <span className="text-blue-400">Games</span>
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <GameCard 
              title="Flappy Bird"
              description="Navigate through obstacles and compete for the highest score."
              imagePath="/images/flappy-bird.png"
              delay={1.1}
            />
            <GameCard 
              title="AI Challenge"
              description="Try to trick the AI into saying a specific word within the time limit."
              imagePath="/images/ai-challenge.png"
              delay={1.3}
            />
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 relative z-20">
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="text-3xl font-arcade text-white text-center mb-12"
          >
            How It <span className="text-purple-400">Works</span>
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard 
              number="01"
              title="Deposit"
              description="Convert Core tokens into platform points"
              color="blue"
              delay={1.7}
            />
            <StepCard 
              number="02"
              title="Compete"
              description="Join game rooms and showcase your skills"
              color="purple"
              delay={1.9}
            />
            <StepCard 
              number="03"
              title="Earn"
              description="Win games and claim your rewards"
              color="pink"
              delay={2.1}
            />
          </div>
        </section>

        <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 py-16 mt-16 relative z-20">
          <div className="container mx-auto px-4">
            <motion.h3 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 2.3 }}
              className="text-3xl font-arcade text-white text-center mb-8"
            >
              Ready to <span className="text-pink-400">Play</span>?
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 2.5 }}
              className="text-center"
            >
              <button 
                onClick={authenticated ? () => window.location.href = '/games' : () => login()} 
                className="btn-arcade-lg bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500"
              >
                {authenticated ? 'Start Playing' : 'Connect Wallet to Begin'}
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}

// Game Card Component - Embedded within the Home page
function GameCard({ title, description, imagePath, delay }: { 
  title: string;
  description: string;
  imagePath: string;
  delay: number;
}) {
  // Create URL-friendly slug from title
  const slug = title.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden border border-blue-900/50"
    >
      <div className="h-48 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent z-10"></div>
        {/* Use a colored div as a placeholder if image isn't available */}
        <div className="absolute inset-0 bg-blue-900/50 flex items-center justify-center">
          <div className="text-xl font-arcade text-white">{title}</div>
        </div>
      </div>
      <div className="p-6">
        <h4 className="text-xl font-arcade text-white mb-2">{title}</h4>
        <p className="text-gray-400 mb-4">{description}</p>
        <Link href={`/games/${slug}`} className="btn-arcade-sm">
          Play Now
        </Link>
      </div>
    </motion.div>
  );
}

// Step Card Component - Embedded within the Home page
function StepCard({ number, title, description, color, delay }: {
  number: string;
  title: string;
  description: string;
  color: 'blue' | 'purple' | 'pink';
  delay: number;
}) {
  const colorVariants = {
    blue: "from-blue-600 to-blue-800",
    purple: "from-purple-600 to-purple-800",
    pink: "from-pink-600 to-pink-800"
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-gray-900/60 backdrop-blur-sm rounded-lg p-6 border border-gray-800"
    >
      <div className={`inline-block text-2xl font-arcade mb-4 bg-gradient-to-r ${colorVariants[color]} text-transparent bg-clip-text`}>
        {number}
      </div>
      <h4 className="text-xl font-arcade text-white mb-2">{title}</h4>
      <p className="text-gray-400">{description}</p>
    </motion.div>
  );
}
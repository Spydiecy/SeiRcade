'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Header() {
  const { login, logout, authenticated, user } = usePrivy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleAddressClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/60 border-b-2 border-neon-blue">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <div className="w-10 h-10 md:w-12 md:h-12 relative mr-3">
            <div className="w-full h-full arcade-box-glow flex items-center justify-center">
              <span className="text-base md:text-xl font-arcade text-white">C</span>
            </div>
          </div>
          <h1 className="text-xl md:text-2xl font-arcade neon-text">
            CORECADE
          </h1>
        </motion.div>
        
        {/* Mobile menu button */}
        <div className="md:hidden">
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none"
          >
            <div className={`w-6 h-0.5 bg-neon-blue mb-1.5 transition-all ${menuOpen ? 'transform rotate-45 translate-y-2' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-neon-blue mb-1.5 transition-all ${menuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-neon-blue transition-all ${menuOpen ? 'transform -rotate-45 -translate-y-2' : ''}`}></div>
          </button>
        </div>
        
        {/* Desktop navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hidden md:flex gap-4 items-center"
        >
          <div className="flex space-x-6 items-center">
            <Link href="/" className="nav-link">
              HOME
            </Link>
            <Link href="/games" className="nav-link">
              GAMES
            </Link>
            <Link href="/leaderboard" className="nav-link">
              LEADERBOARD
            </Link>
          </div>
          
          {authenticated ? (
            <div className="flex items-center gap-4 relative">
              <div 
                onClick={handleAddressClick}
                className="text-xs font-arcade text-neon-green pixel-box cursor-pointer"
              >
                <span className="text-neon-blue">PLAYER:</span> {user?.email?.toString() || (user?.wallet?.address && `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`)}
              </div>
              
              {/* User menu dropdown */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-black border-2 border-neon-blue p-2 z-50">
                  <button 
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left py-2 px-3 text-xs font-arcade text-white hover:bg-neon-blue/20"
                  >
                    DISCONNECT
                  </button>
                </div>
              )}
              
              <Link href="/dashboard" className="arcade-button-blue">
                DASHBOARD
              </Link>
            </div>
          ) : (
            <button 
              onClick={() => login()}
              className="arcade-button-green"
            >
              CONNECT WALLET
            </button>
          )}
        </motion.div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="md:hidden border-t border-neon-blue/30 bg-black/80 backdrop-blur-md"
        >
          <div className="flex flex-col items-center py-4 space-y-4">
            <Link href="/" className="nav-link" onClick={() => setMenuOpen(false)}>
              HOME
            </Link>
            <Link href="/games" className="nav-link" onClick={() => setMenuOpen(false)}>
              GAMES
            </Link>
            <Link href="/leaderboard" className="nav-link" onClick={() => setMenuOpen(false)}>
              LEADERBOARD
            </Link>
            
            {authenticated ? (
              <>
                <button onClick={() => {
                  logout();
                  setMenuOpen(false);
                }} className="w-4/5 text-center arcade-button-pink">
                  DISCONNECT
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  login();
                  setMenuOpen(false);
                }}
                className="w-4/5 arcade-button-green text-center"
              >
                CONNECT WALLET
              </button>
            )}
          </div>
        </motion.div>
      )}
    </header>
  );
}
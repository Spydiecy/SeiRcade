'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Header() {
  const { login, logout, authenticated, user } = usePrivy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleAddressClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'GAMES', path: '/games' },
    { name: 'LEADERBOARD', path: '/leaderboard' },
    { name: 'ABOUT', path: '/about' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'backdrop-blur-md bg-black/80 border-b-2 border-neon-blue shadow-md' : 'bg-black/40 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center"
        >
          <Link href="/" className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 relative mr-3">
              <Image 
                src="/images/logo.svg" 
                alt="CoreCade Logo" 
                width={48} 
                height={48} 
                priority 
              />
            </div>
            <h1 className="text-xl md:text-2xl font-arcade neon-text">
              CORECADE
            </h1>
          </Link>
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
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path} className="nav-link">
                {link.name}
              </Link>
            ))}
          </div>
          
          {authenticated ? (
            <div className="flex items-center gap-4 relative">
              <div 
                onClick={handleAddressClick}
                className="text-xs font-arcade text-neon-green pixel-box cursor-pointer"
              >
                <span className="text-neon-blue">PLAYER:</span> {String(user?.email || (user?.wallet?.address && `${user.wallet.address.slice(0, 6)}...${user.wallet.address.slice(-4)}`))}
              </div>
              
              {/* User menu dropdown */}
              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-black border-2 border-neon-blue p-2 z-50">
                  <Link href="/profile" className="block py-2 px-3 text-xs font-arcade text-white hover:bg-neon-blue/20">
                    PROFILE
                  </Link>
                  <Link href="/dashboard" className="block py-2 px-3 text-xs font-arcade text-white hover:bg-neon-blue/20">
                    DASHBOARD
                  </Link>
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
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path} 
                className="nav-link" 
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            
            {authenticated ? (
              <>
                <Link href="/profile" className="w-4/5 arcade-button-pink text-center mb-2" onClick={() => setMenuOpen(false)}>
                  PROFILE
                </Link>
                <Link href="/dashboard" className="w-4/5 arcade-button-blue text-center mb-2" onClick={() => setMenuOpen(false)}>
                  DASHBOARD
                </Link>
                <button onClick={() => {
                  logout();
                  setMenuOpen(false);
                }} className="w-4/5 text-center arcade-button-green">
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
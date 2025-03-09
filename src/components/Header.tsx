'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { usePoints } from '@/app/contexts/PointsContext';

export default function Header() {
  const { login, logout, authenticated, user } = usePrivy();
  const { balance, loading: pointsLoading, refreshBalance } = usePoints();
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

  // Fetch points when authenticated
  useEffect(() => {
    if (authenticated) {
      refreshBalance();
    }
  }, [authenticated, refreshBalance]);

  const navLinks = [
    { name: 'HOME', path: '/' },
    { name: 'GAMES', path: '/games' },
    { name: 'ABOUT', path: '/about' },
  ];

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4 py-2">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image 
              src="/corecade-logo.png" 
              alt="CoreCade" 
              width={40} 
              height={40} 
              className="mr-2"
            />
            <span className="font-arcade text-xl text-white hidden sm:block">CORECADE</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.path}
                className="font-arcade text-sm text-white hover:text-neon-pink transition-colors duration-200"
              >
                {link.name}
              </Link>
            ))}
          </nav>
          
          {/* Auth Section */}
          <div className="flex items-center">
            {authenticated ? (
              <div className="flex items-center space-x-4 relative">
                {/* Points Display */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-black/40 border border-neon-green px-3 py-1 rounded-full flex items-center"
                >
                  <span className="text-neon-green font-arcade text-sm">
                    {pointsLoading ? '...' : balance.toLocaleString()} PTS
                  </span>
                </motion.div>

                {/* User Menu Trigger */}
                <button 
                  onClick={handleAddressClick} 
                  className="bg-transparent border border-neon-pink rounded-full px-3 py-1 text-white text-sm hover:bg-neon-pink/10 transition-colors duration-200"
                >
                  {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)} ▼
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-10 w-48 bg-black/90 backdrop-blur-md border border-neon-pink rounded-md shadow-lg z-50 py-1">
                    <Link 
                      href="/dashboard" 
                      className="block px-4 py-2 text-sm text-white hover:bg-neon-pink/20 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Dashboard
                    </Link>
                    <button 
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }} 
                      className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-neon-pink/20 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={login} 
                className="arcade-button-green"
              >
                CONNECT
              </button>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden ml-4 text-white"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-black/90 backdrop-blur-md mt-2 py-2 px-4 rounded-md border border-neon-blue">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.path}
                className="block py-2 font-arcade text-white hover:text-neon-pink transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
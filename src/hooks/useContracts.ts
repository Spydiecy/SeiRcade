import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { CONTRACTS } from '../constants/contracts';
import POINTS_MANAGER_ABI from '../constants/pointsManagerAbi';
import GAME_ROOM_ABI from '../constants/gameRoomAbi';
import STATISTICS_TRACKER_ABI from '../constants/statisticsTrackerAbi';

/**
 * Custom hook to access the CoreCade smart contracts
 * Initializes contract instances when wallet is connected
 */
export function useContracts() {
  const { ready } = usePrivy();
  const { wallets } = useWallets();
  const [contracts, setContracts] = useState<{
    pointsManager: ethers.Contract | null;
    gameRoom: ethers.Contract | null;
    statisticsTracker: ethers.Contract | null;
  }>({
    pointsManager: null,
    gameRoom: null,
    statisticsTracker: null
  });
  
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  
  useEffect(() => {
    // Ensure we have a ready wallet
    if (!ready || !wallets.length) return;
    
    const initializeProvider = async () => {
      try {
        // Get the first wallet's Ethereum provider
        const privyProvider = await wallets[0].getEthereumProvider();
        
        // Create ethers provider using the Privy provider
        const ethersProvider = new ethers.providers.Web3Provider(privyProvider);
        setProvider(ethersProvider);
        
        // Get the signer from the provider
        const ethSigner = ethersProvider.getSigner();
        setSigner(ethSigner);
        
        // Initialize contract instances
        const pointsManager = new ethers.Contract(
          CONTRACTS.POINTS_MANAGER,
          POINTS_MANAGER_ABI,
          ethSigner
        );
        
        const gameRoom = new ethers.Contract(
          CONTRACTS.GAME_ROOM,
          GAME_ROOM_ABI,
          ethSigner
        );
        
        const statisticsTracker = new ethers.Contract(
          CONTRACTS.STATISTICS_TRACKER,
          STATISTICS_TRACKER_ABI,
          ethSigner
        );
        
        setContracts({
          pointsManager,
          gameRoom,
          statisticsTracker
        });
        
        console.log("Contracts initialized successfully");
      } catch (error) {
        console.error("Error initializing contracts:", error);
      }
    };
    
    initializeProvider();
  }, [ready, wallets]);
  
  return {
    ...contracts,
    provider,
    signer
  };
}
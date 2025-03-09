import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useWallet } from '@/app/contexts/WalletContext';

export function RoomCard({ roomId }: { roomId: number }) {
  const router = useRouter();
  const [room, setRoom] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getRoomDetails, getPlayersInRoom } = useGameRoom();
  const { walletAddress } = useWallet();
  
  // Use this ref to prevent multiple simultaneous data loading
  const isLoadingRef = useRef(false);
  // Store the roomId in a ref to prevent reloading on component re-renders
  const roomIdRef = useRef(roomId);
  // Track if the component is mounted
  const isMountedRef = useRef(true);
  
  // Memoize the loadRoom function so it doesn't change on each render
  const loadRoom = useCallback(async () => {
    // Skip if already loading or component unmounted
    if (isLoadingRef.current || !isMountedRef.current) return;
    
    // Set ref flag to prevent multiple simultaneous calls
    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get room details
      const roomDetails = await getRoomDetails(roomIdRef.current);
      if (!roomDetails) {
        if (isMountedRef.current) {
          setError("Room not found");
          setLoading(false);
        }
        return;
      }
      
      // Get players in room
      let players: any[] = [];
      let userScore = null;
      
      try {
        players = await getPlayersInRoom(roomIdRef.current);
        
        // Find current user's score if they played in this room
        if (walletAddress && players && Array.isArray(players)) {
          // Safely find player with proper null checks
          const userPlayer = players.find(
            (player: any) => player && 
              player.playerAddress && 
              typeof player.playerAddress === 'string' && 
              player.playerAddress.toLowerCase() === walletAddress.toLowerCase()
          );
          
          if (userPlayer && userPlayer.hasSubmittedScore) {
            userScore = userPlayer.score;
          }
        }
      } catch (playerError) {
        console.warn(`Error fetching players for room ${roomIdRef.current}:`, playerError);
        // Continue with just the room details
        players = [];
      }
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        // Set room with enhanced data
        setRoom({
          ...roomDetails,
          userScore,
          players
        });
        
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error loading room ${roomIdRef.current}:`, error);
      if (isMountedRef.current) {
        setError(error.message || "Failed to load room data");
        setLoading(false);
      }
    } finally {
      // Clear the loading flag
      isLoadingRef.current = false;
    }
  }, [getRoomDetails, getPlayersInRoom, walletAddress]); // Minimal dependencies
  
  // Load room data once on mount
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;
    
    // Load room data
    loadRoom();
    
    // Cleanup function to handle component unmounting
    return () => {
      isMountedRef.current = false;
    };
  }, [loadRoom]); // Only depend on the memoized loadRoom function
  
  const getGameTypeName = (type: number) => {
    const gameTypes: {[key: number]: string} = {
      0: 'Flappy Bird',
      1: 'AI Challenge'
    };
    return gameTypes[type] || 'Unknown';
  };
  
  const getStatusName = (status: number) => {
    const statusTypes: {[key: number]: string} = {
      0: 'Waiting',
      1: 'In Progress',
      2: 'Completed',
      3: 'Expired',
      4: 'Canceled'
    };
    return statusTypes[status] || 'Unknown';
  };
  
  const getStatusColor = (status: number) => {
    const statusColors: {[key: number]: string} = {
      0: 'text-yellow-400',
      1: 'text-neon-blue',
      2: 'text-neon-green',
      3: 'text-red-400',
      4: 'text-gray-400'
    };
    return statusColors[status] || 'text-white';
  };
  
  // Function to safely navigate to the game page with async handling
  const navigateToGame = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // Show loading indicator if needed
      setLoading(true);
      
      // Navigate programmatically instead of using a link
      console.log(`Navigating to game: /games?room=${roomId}`);
      
      // Use push() with await to ensure navigation completes
      await router.push(`/games?room=${roomId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      // Handle error if needed
      setError("Failed to navigate to game. Try refreshing the page.");
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-black/30 border border-gray-700 rounded-md p-4 h-40 flex items-center justify-center">
        <p className="text-gray-400">Loading room...</p>
      </div>
    );
  }
  
  if (error || !room) {
    return (
      <div className="bg-black/30 border border-gray-700 rounded-md p-4 h-40 flex items-center justify-center">
        <p className="text-red-400">{error || "Failed to load room"}</p>
      </div>
    );
  }
  
  // Get action text based on room status
  let actionText = 'View Details';
  if (room.status === 0) actionText = 'Join Game →';
  else if (room.status === 1) actionText = 'Return to Game →';
  else if (room.status === 2) actionText = 'View Results →';
  
  // Is creator check
  const isCreator = room?.creator && walletAddress && 
    room.creator.toLowerCase() === walletAddress.toLowerCase();
  
  return (
    <div className="bg-black/30 border border-gray-700 hover:border-neon-blue transition-colors duration-200 rounded-md p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-arcade text-white mb-2">{room.name || `Room #${roomId}`}</h3>
        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(room.status)}`}>
          {getStatusName(room.status)}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Game:</span> {getGameTypeName(room.gameType)}
        </p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Buy-in:</span> {parseInt(room.entryFee).toLocaleString()} points
        </p>
        <p className="text-sm text-gray-400">
          <span className="text-gray-500">Players:</span> {room.currentPlayers}/{room.maxPlayers}
        </p>
        
        {isCreator && (
          <p className="text-sm text-neon-green">
            <span className="text-gray-500">Status:</span> You created this room
          </p>
        )}
        
        {room.status === 2 && room.winner && (
          <p className="text-sm text-gray-400">
            <span className="text-gray-500">Winner:</span> 
            <span className={walletAddress && room.winner.toLowerCase() === walletAddress.toLowerCase() 
              ? "text-neon-green" 
              : "text-gray-300"
            }>
              {walletAddress && room.winner.toLowerCase() === walletAddress.toLowerCase() 
                ? 'You!' 
                : `${room.winner.slice(0, 6)}...${room.winner.slice(-4)}`
              }
            </span>
          </p>
        )}
        
        {room.userScore !== null && (
          <p className="text-sm text-gray-400">
            <span className="text-gray-500">Your Score:</span> <span className="text-neon-pink">{room.userScore}</span>
          </p>
        )}
      </div>
      
      {/* Replace Link with button to use router navigation */}
      <button 
        onClick={navigateToGame}
        className="text-neon-blue text-sm hover:underline inline-block bg-transparent border-none cursor-pointer p-0"
      >
        {actionText}
      </button>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import FlappyBird from '@/components/games/FlappyBird';
import AIChallenge from '@/components/games/AIChallenge';
import { usePrivy } from '@privy-io/react-auth';
import { useGameRoom, GameType, RoomType, RoomStatus } from '@/hooks/useGameRoom';
import { usePoints } from '@/app/contexts/PointsContext';
import { useWallet } from '@/app/contexts/WalletContext';

export default function GamesPage() {
  const searchParams = useSearchParams();
  const { authenticated, user } = usePrivy();
  const { walletConnected, connectWallet } = useWallet();
  const { balance: pointsBalance, refreshBalance, loading: pointsLoading } = usePoints();
  const router = useRouter();
  
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [joinRoomId, setJoinRoomId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Game states
  const [gameSessionData, setGameSessionData] = useState<{
    roomId: number | null;
    entryFee: string;
    maxPlayers: number;
    gameType: number;
    currentPlayers: number;
    isCreator?: boolean;
    status: number;
  } | null>(null);
  const [gameScore, setGameScore] = useState<number | null>(null);
  const [gameResult, setGameResult] = useState<{
    success: boolean;
    message: string;
    winnings?: string;
  } | null>(null);
  
  // Contract hooks
  const { 
    createRoom, 
    joinRoom, 
    submitScore, 
    claimPrize,
    getRoomDetails,
    getPlayersInRoom,
    loading: gameRoomLoading, 
    error: gameRoomError
  } = useGameRoom();
  
  // Room creation form state
  const [roomSettings, setRoomSettings] = useState({
    entryFee: '50',
    maxPlayers: '2',
    gameType: 'FlappyBird',
    roomType: 'public',
    inviteCode: '',
    expirationTime: '3600'
  });
  
  // Active rooms from blockchain
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  
  // Add a state to track if the player has already played in this room
  const [hasPlayedInRoom, setHasPlayedInRoom] = useState<boolean>(false);
  
  // Improved initialization for room loading with better debugging
  useEffect(() => {
    // First check URL parameters
    const roomParam = searchParams.get('room');
    console.log('URL params:', Object.fromEntries(searchParams.entries()));
    console.log('Room param:', roomParam, typeof roomParam);
    
    // Only clear state if we're not already in a game
    if (!activeGame) {
      // Clear all game state except activeRoomId
      setGameScore(null);
      setHasPlayedInRoom(false);
      setGameResult(null);
      setGameSessionData(null);
    }
    
    let roomIdToLoad: number | null = null;
    
    // First try to get room ID from URL
    if (roomParam) {
      try {
        const parsedId = Number(roomParam);
        if (!isNaN(parsedId) && parsedId > 0) {
          roomIdToLoad = parsedId;
          console.log(`Found valid room ID in URL: ${parsedId}`);
        }
      } catch (e) {
        console.error('Error parsing room ID from URL:', e);
      }
    }
    
    // If no room ID in URL, check session storage (for dashboard navigation)
    if (!roomIdToLoad && typeof window !== 'undefined') {
      try {
        const pendingRoomId = sessionStorage.getItem('pendingRoomId');
        console.log('Checking session storage for pendingRoomId:', pendingRoomId);
        
        if (pendingRoomId) {
          const parsedId = Number(pendingRoomId);
          if (!isNaN(parsedId) && parsedId > 0) {
            roomIdToLoad = parsedId;
            console.log(`Found valid room ID in session storage: ${parsedId}`);
            
            // Clear from session storage to avoid reloading on page refresh
            sessionStorage.removeItem('pendingRoomId');
            
            // Update URL to include room ID
            const url = new URL(window.location.href);
            url.searchParams.set('room', parsedId.toString());
            window.history.pushState({}, '', url.toString());
          }
        }
      } catch (e) {
        console.error('Error checking session storage:', e);
      }
    }
    
    // Load room if we found a valid ID
    if (roomIdToLoad) {
      setActiveRoomId(roomIdToLoad);
      loadRoomDetails(roomIdToLoad);
    }
    
    // Loading animation for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Load active rooms for browsing
    loadActiveRooms();
  }, [searchParams]); // Dependency on searchParams ensures this runs on navigation
  
  // Refresh user balance when authenticated
  useEffect(() => {
    if (walletConnected) {
      refreshBalance();
    }
  }, [walletConnected, refreshBalance]);
  
  // Improved loadRoomDetails with better error handling and debugging
  const loadRoomDetails = async (roomId: number) => {
    try {
      console.log(`[loadRoomDetails] Starting for roomId: ${roomId} (${typeof roomId})`);
      setIsLoading(true);
      
      if (!roomId || isNaN(roomId) || roomId <= 0) {
        console.error(`[loadRoomDetails] Invalid room ID: ${roomId}`);
        setNotification({
          type: 'error',
          message: 'Invalid room ID provided'
        });
        setIsLoading(false);
        return;
      }
      
      // Update URL to include room ID without causing navigation
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId.toString());
      window.history.pushState({}, '', url.toString());
      console.log(`[loadRoomDetails] Updated URL to: ${url.toString()}`);
      
      console.log(`[loadRoomDetails] Fetching details for room ID: ${roomId}`);
      // Force roomId to number to ensure consistency
      const numericRoomId = Number(roomId);
      const room = await getRoomDetails(numericRoomId);
      
      if (!room) {
        console.error(`[loadRoomDetails] Room #${roomId} not found`);
        setNotification({
          type: 'error',
          message: `Room #${roomId} not found or has been deleted`
        });
        setIsLoading(false);
        return;
      }
      
      // Log room details for debugging
      console.log('[loadRoomDetails] Room details:', room);
      console.log('[loadRoomDetails] Room status:', room.status);
      
      // Get current user address
      const currentUserAddress = user?.wallet?.address?.toLowerCase();
      
      // Check if user is the room creator
      const isCreator = currentUserAddress && 
        room.creator && 
        room.creator.toLowerCase() === currentUserAddress;
      
      console.log("Is user the room creator?", isCreator);
      
      // Check if player has already played in this room
      const playersData = await getPlayersInRoom(roomId);
      console.log("Players in room:", playersData);
      
      // Special handling for rooms based on their status
      if (room.status === 0) { // Filling
        // Check if the room needs more players
        if (room.currentPlayers < room.maxPlayers) {
          // Room isn't full yet
          if (isCreator) {
            console.log('[loadRoomDetails] User is the creator of a non-full room in Filling status');
            setHasPlayedInRoom(false); // Allow creator to join, but they'll hit the contract error if they try to submit a score
            
            setNotification({
              type: 'info',
              message: `This room is not full yet (${room.currentPlayers}/${room.maxPlayers} players). According to the contract rules, rooms must be full before scores can be submitted. Invite more players to join or wait for the room to fill up.`
            });
          } else {
            // For non-creators, check if they're already in the room
            // Check directly if the user's address is in the room's playerAddresses array
            const userIsPlayer = Array.isArray(playersData) && playersData.some(player => 
              player && 
              player.playerAddress && 
              player.playerAddress.toLowerCase() === currentUserAddress
            ) || false;
            
            if (userIsPlayer) {
              console.log('[loadRoomDetails] User is already a player in this room');
              setHasPlayedInRoom(false); // Allow to join, but they'll hit the contract error if they try to submit a score
              
              setNotification({
                type: 'info',
                message: `You've joined this room, but it isn't full yet (${room.currentPlayers}/${room.maxPlayers} players). According to contract rules, all players can only submit scores once the room is full and Active.`
              });
            } else {
              console.log('[loadRoomDetails] User needs to join this room');
              // User needs to join the room first
              setNotification({
                type: 'info',
                message: `You need to join this room first. Click "Join Room" below.`
              });
            }
          }
        } else {
          // Room is full but still in Filling status (might be a contract state delay)
          console.log('[loadRoomDetails] Room is full but still in Filling status');
          setNotification({
            type: 'info',
            message: `The room is full (${room.currentPlayers}/${room.maxPlayers} players) but not yet Active. This might be a temporary state delay. Try again in a moment.`
          });
        }
      } else if (room.status === 1) { // Active
        // Check if player has already submitted a score
        const playerHasSubmittedScore = !!(Array.isArray(playersData) && 
          currentUserAddress && 
          playersData.some(
            player => player && 
              player.playerAddress && 
              player.playerAddress.toLowerCase() === currentUserAddress && 
              player.hasSubmittedScore
          ));
        
        // Check if player is in the room by directly checking if their address is in the playerAddresses array
        // This is the key fix - we need to check if the user is a player in the room
        const userIsPlayer = isCreator || // Creator is always a player
          (Array.isArray(playersData) && playersData.some(player => 
            player && 
            player.playerAddress && 
            player.playerAddress.toLowerCase() === currentUserAddress
          )) || false;
        
        console.log('[loadRoomDetails] User is player check:', { 
          userAddress: currentUserAddress, 
          isCreator, 
          userIsPlayer, 
          playerHasSubmittedScore,
          playersData
        });
        
        if (!userIsPlayer) {
          // User is not a player in this room
          setHasPlayedInRoom(true); // Prevent playing
          setNotification({
            type: 'info',
            message: `You are not a player in this room. The room is already active and not accepting new players.`
          });
        } else if (playerHasSubmittedScore) {
          // User has already submitted a score
          setHasPlayedInRoom(true);
          setNotification({
            type: 'info',
            message: `You've already submitted a score for this room. Waiting for other players to submit their scores.`
          });
          
          // Check if all players have submitted scores
          const allSubmitted = playersData.every(player => player && player.hasSubmittedScore);
          if (allSubmitted) {
            setNotification({
              type: 'info',
              message: `All players have submitted scores. The winner will be determined soon.`
            });
          }
        } else {
          // User is a player but hasn't submitted a score yet
          setHasPlayedInRoom(false);
          setNotification({
            type: 'info',
            message: `This room is active and ready for play! Submit your score now.`
          });
        }
      } else if (room.status === 2) { // Completed
        setHasPlayedInRoom(true); // Prevent playing in completed rooms
        checkGameResult(room);
      } else if (room.status === 3) { // Expired
        setHasPlayedInRoom(true); // Prevent playing in expired rooms
        setNotification({
          type: 'info',
          message: `This room has expired.`
        });
      } else if (room.status === 4) { // Canceled
        setHasPlayedInRoom(true); // Prevent playing in canceled rooms
        setNotification({
          type: 'info',
          message: `This room has been canceled.`
        });
      }
      
      // Store room details for future reference
      setGameSessionData({
        roomId: room.id,
        entryFee: room.entryFee,
        maxPlayers: room.maxPlayers,
        gameType: room.gameType,
        currentPlayers: room.currentPlayers,
        isCreator: isCreator,
        status: room.status
      });
      
      if (room.gameType === 0) { // GameType.FlappyBird
        setActiveGame('flappy-bird');
      } else if (room.gameType === 1) { // GameType.AIChallenge
        setActiveGame('ai-challenge');
      } else {
        setNotification({
          type: 'error',
          message: `Unknown game type (${room.gameType})`
        });
      }
      
      setIsLoading(false);
    } catch (error: any) {
      console.error("Error loading room details:", error);
      setNotification({
        type: 'error',
        message: `Failed to load room details: ${error.message || 'Unknown error'}`
      });
      setIsLoading(false);
    }
  };
  
  // Improved loadActiveRooms function with better ID handling
  const loadActiveRooms = async () => {
    setLoadingRooms(true);
    
    try {
      // In a real app, we would have a more efficient contract method
      // to get all active rooms. For now we'll use this approach:
      
      // First try to get the total number of rooms (if contract supports it)
      let totalRooms = 50; // Increased to find more potential rooms
      try {
        // This would be a contract call like: const count = await gameRoom.getTotalRoomCount();
        // For now we'll use a fixed number
        totalRooms = 50;
      } catch (err) {
        console.warn("Could not get total room count, using default value");
      }
      
      // Create array of room IDs to check
      const roomIds = Array.from({ length: totalRooms }, (_, i) => i + 1);
      
      // Load rooms in batches to avoid too many parallel requests
      const batchSize = 5;
      let fillingRooms: any[] = [];
      
      for (let i = 0; i < roomIds.length; i += batchSize) {
        const batch = roomIds.slice(i, i + batchSize);
        const batchPromises = batch.map(id => 
          getRoomDetails(id)
            .then(room => room)
            .catch(() => null)
        );
        
        const batchResults = await Promise.all(batchPromises);
        const validRooms = batchResults
          .filter(room => room && room.status === 0) // Only get rooms with "Waiting" status
          .map(room => {
            // Ensure room ID is a valid number
            const roomId = room!.id ? Number(room!.id) : null;
            if (roomId === null || isNaN(roomId)) {
              console.error("Invalid room ID:", room!.id);
              return null;
            }
            
            return {
              id: roomId, // Ensure ID is a number
              game: room!.gameType === 0 ? 'FLAPPY BIRD' : 'AI CHALLENGE',
              entry: room!.entryFee,
              players: `${room!.currentPlayers}/${room!.maxPlayers}`,
              time: formatTimeAgo(room!.creationTime),
              type: room!.roomType === 0 ? 'PUBLIC' : 'PRIVATE'
            };
          })
          .filter(room => room !== null); // Remove invalid rooms
        
        fillingRooms = [...fillingRooms, ...validRooms];
      }
      
      // Ensure rooms have unique IDs and remove duplicates
      const uniqueRooms = Array.from(
        new Map(fillingRooms.map(room => [room.id, room])).values()
      );
      
      // Sort rooms by creation time (newest first)
      uniqueRooms.sort((a, b) => {
        const aTime = parseInt(a.time);
        const bTime = parseInt(b.time);
        return isNaN(aTime) || isNaN(bTime) ? 0 : bTime - aTime;
      });
      
      console.log(`Loaded ${uniqueRooms.length} unique active rooms`);
      setActiveRooms(uniqueRooms);
      
    } catch (error) {
      console.error("Error loading active rooms:", error);
      setNotification({
        type: 'error',
        message: 'Failed to load active rooms. Please try again.'
      });
    } finally {
      setLoadingRooms(false);
    }
  };
  
  // Format timestamp to "X min ago" format
  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };
  
  // Handle game start
  const handleGameStart = () => {
    if (!walletConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to play a game'
      });
      return;
    }
    
    // Check if player has already played in this room
    if (hasPlayedInRoom) {
      setNotification({
        type: 'error',
        message: 'You have already played in this room! Each player can only play once per room.'
      });
      return;
    }
    
    if (activeGame === 'flappy-bird') {
      setGameScore(null);
      setGameResult(null);
    } else if (activeGame === 'ai-challenge') {
      // AI Challenge setup
    }
  };
  
  // Handle game over
  const handleGameOver = async (score: number) => {
    console.log(`[handleGameOver] Game over with score: ${score}`);
    
    // Immediately set the score to prevent multiple submissions
    setGameScore(score);
    
    // If we're in a room, submit the score to the blockchain
    if (gameSessionData?.roomId) {
      try {
        console.log(`[handleGameOver] Submitting score ${score} for room ${gameSessionData.roomId}, isCreator: ${gameSessionData.isCreator}, status: ${gameSessionData.status}`);
        
        // Show loading notification
        setNotification({
          type: 'info',
          message: 'Submitting your score... Please wait'
        });
        
        // First, check if the room is in Active status (required by contract)
        if (gameSessionData.status !== 1) { // Not Active
          console.error(`[handleGameOver] Room is not in Active status. Current status: ${gameSessionData.status}`);
          
          if (gameSessionData.status === 0) { // Filling
            setNotification({
              type: 'error',
              message: `Cannot submit score - Room must be in Active status (currently in Filling status). A room becomes Active when it reaches its player limit.`
            });
          } else {
            setNotification({
              type: 'error',
              message: `Cannot submit score - Room is not in Active status. Current status: ${gameSessionData.status}`
            });
          }
          
          return;
        }
        
        // Submit score attempt - the contract will validate if this is allowed
        const result = await submitScore(gameSessionData.roomId, score);
        
        if (result) {
          // Success! Score was submitted
          console.log("[handleGameOver] Score submission successful");
          
          // Mark that player has played to prevent additional plays
          setHasPlayedInRoom(true);
          
          // Show success notification
          setNotification({
            type: 'success',
            message: `Score of ${score} submitted successfully! Waiting for other players to submit their scores.`
          });
          
          // Fetch updated room data after submitting score
          const updatedRoom = await getRoomDetails(gameSessionData.roomId);
          
          if (updatedRoom) {
            console.log("[handleGameOver] Updated room after score submission:", updatedRoom);
            
            // Update session data with new status
            setGameSessionData({
              ...gameSessionData,
              status: updatedRoom.status
            });
            
            // Get players to check if all have submitted scores
            const players = await getPlayersInRoom(gameSessionData.roomId);
            const allSubmitted = Array.isArray(players) && 
              players.every(player => player && player.hasSubmittedScore);
            
            if (allSubmitted) {
              setNotification({
                type: 'info',
                message: `All players have submitted scores. The winner will be determined soon.`
              });
            }
            
            // If room is now completed, check the winner
            if (updatedRoom.status === 2) { // Completed
              checkGameResult(updatedRoom);
            } else {
              // If room is still active, set up a polling interval to check for completion
              const checkInterval = setInterval(async () => {
                try {
                  console.log("[handleGameOver] Checking if room is completed...");
                  const refreshedRoom = await getRoomDetails(gameSessionData.roomId!);
                  if (refreshedRoom && refreshedRoom.status === 2) {
                    console.log("[handleGameOver] Room is now completed! Checking results...");
                    checkGameResult(refreshedRoom);
                    clearInterval(checkInterval);
                  }
                } catch (error) {
                  console.error("[handleGameOver] Error checking room status:", error);
                }
              }, 5000); // Check every 5 seconds
              
              // Clear interval after 2 minutes to avoid running indefinitely
              setTimeout(() => clearInterval(checkInterval), 2 * 60 * 1000);
            }
          }
        } else {
          // Score submission failed
          console.error("[handleGameOver] Score submission failed");
          
          // Don't mark as played so they can try again
          setHasPlayedInRoom(false);
          
          // Error notifications are handled by the submitScore function
        }
      } catch (error) {
        console.error("[handleGameOver] Error in overall score submission process:", error);
        
        // Reset flag to allow retry
        setHasPlayedInRoom(false);
        
        // Set a generic error message
        setNotification({
          type: 'error',
          message: 'Error submitting score. Please try again later.'
        });
      }
    }
  };
  
  // Improved checkGameResult function for better handling of winners and game completion
  const checkGameResult = (room: any) => {
    // Log the room details for debugging
    console.log("Checking game result for room:", room);
    
    const userAddress = user?.wallet?.address;
    if (!userAddress) {
      console.log("No user wallet address found");
      return;
    }
    
    // Check room status
    if (room.status !== 2) { // Not completed
      console.log(`Room ${room.id} is not yet completed (status: ${room.status})`);
      return;
    }
    
    console.log(`Room winner: ${room.winner || 'No winner yet'}`);
    
    // Check if there's a winner set
    if (room.winner && room.winner.toLowerCase() === userAddress.toLowerCase()) {
      // Player won!
      console.log("User is the winner!");
      setGameResult({
        success: true,
        message: 'Congratulations! You won the game!',
        winnings: room.prizePool
      });
      
      // Show a prominent notification
      setNotification({
        type: 'success',
        message: `Congratulations! You won the game with a prize of ${parseInt(room.prizePool).toLocaleString()} points!`
      });
      
    } else if (room.winner) {
      // Game completed but player didn't win
      console.log("User is not the winner");
      setGameResult({
        success: false,
        message: 'Game over! Another player had a higher score.'
      });
      
      // Show a notification
      setNotification({
        type: 'info',
        message: `Game completed. The winner was ${room.winner.slice(0, 6)}...${room.winner.slice(-4)}`
      });
      
    } else {
      // Game is marked as completed but no winner yet (strange state)
      console.log("Room is completed but has no winner");
      setGameResult({
        success: false,
        message: 'Game is marked as completed but has no determined winner yet.'
      });
    }
  };
  
  // Handle claim prize
  const handleClaimPrize = async (roomId: number) => {
    if (!walletConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to claim your prize'
      });
      return;
    }
    
    try {
      const result = await claimPrize(roomId);
      
      if (result) {
        setNotification({
          type: 'success',
          message: 'Prize claimed successfully!'
        });
        
        // Refresh balance
        refreshBalance();
        
        // Reset game session
        resetGameSession();
        
        // Reload rooms list
        loadActiveRooms();
      }
    } catch (error: any) {
      console.error('Error claiming prize:', error);
      setNotification({
        type: 'error',
        message: `Error: ${error.message || 'Failed to claim prize'}`
      });
    }
  };
  
  // Updated room creation to better handle newly created rooms
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to create a room'
      });
      return;
    }
    
    try {
      // Check for missing required fields
      if (!roomSettings.entryFee || !roomSettings.maxPlayers || !roomSettings.gameType) {
        setNotification({
          type: 'error',
          message: 'Please fill in all required fields'
        });
        return;
      }
      
      // Check for private rooms without invite code
      if (roomSettings.roomType === 'private' && !roomSettings.inviteCode) {
        setNotification({
          type: 'error',
          message: 'Private rooms require an invite code'
        });
        return;
      }
      
      // Calculate settings
      const gameTypeValue = roomSettings.gameType === 'FlappyBird' ? 0 : 1; // GameType enum values
      const roomTypeValue = roomSettings.roomType === 'public' ? 0 : 1; // RoomType enum values
      
      console.log("Creating room with settings:", {
        entryFee: roomSettings.entryFee,
        maxPlayers: parseInt(roomSettings.maxPlayers),
        gameType: gameTypeValue,
        roomType: roomTypeValue,
        inviteCode: roomSettings.inviteCode,
        expirationTime: parseInt(roomSettings.expirationTime)
      });
      
      // Create loading notification
      setNotification({
        type: 'info',
        message: 'Creating your game room... Please wait'
      });
      
      const newRoomId = await createRoom(
        roomSettings.entryFee,
        parseInt(roomSettings.maxPlayers),
        gameTypeValue,
        roomTypeValue,
        roomSettings.inviteCode,
        parseInt(roomSettings.expirationTime)
      );
      
      if (newRoomId) {
        console.log(`Room created with ID: ${newRoomId}`);
        
        // Clear form
        setRoomSettings({
          entryFee: '10',
          maxPlayers: '2',
          gameType: '0',
          roomType: '0',
          inviteCode: '',
          expirationTime: '3600'
        });
        
        // Hide modal
        setShowRoomModal(false);
        
        // Show success message about room activation requirements
        setNotification({
          type: 'success',
          message: `Room #${newRoomId} created successfully! Note: According to the contract, rooms will only become Active and allow score submission once they reach the maximum number of players (${parseInt(roomSettings.maxPlayers)}). The winner is determined only after all players have submitted their scores.`
        });
        
        // Load room details and activate game
        loadRoomDetails(newRoomId);
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to create room. Please try again.'
        });
      }
    } catch (error: any) {
      console.error("Error creating room:", error);
      setNotification({
        type: 'error',
        message: `Error: ${error.message || 'Failed to create room'}`
      });
    }
  };
  
  // Handle joining a room with improved checks
  const handleJoinRoom = async (roomId: number, inviteCode: string = '') => {
    if (!walletConnected) {
      setNotification({
        type: 'error',
        message: 'Please connect your wallet to join a room'
      });
      return;
    }
    
    try {
      // First check if room exists and is in valid state
      const room = await getRoomDetails(roomId);
      if (!room) {
        setNotification({
          type: 'error',
          message: 'Room not found or has been deleted'
        });
        return;
      }
      
      // Check if room is already full
      if (room.currentPlayers >= room.maxPlayers) {
        setNotification({
          type: 'error',
          message: 'This room is already full'
        });
        return;
      }
      
      // Check if room is already completed
      if (room.status === 2) { // Completed
        setNotification({
          type: 'error',
          message: 'This game room has already been completed'
        });
        return;
      }
      
      // Check if the user is the creator - creators are automatically in the room
      const currentUserAddress = user?.wallet?.address?.toLowerCase();
      const isCreator = currentUserAddress && 
        room.creator && 
        room.creator.toLowerCase() === currentUserAddress;
      
      // Check if user is already in this room
      const players = await getPlayersInRoom(roomId);
      const isAlreadyInRoom = Array.isArray(players) && currentUserAddress && 
        players.some(player => 
          player && 
          player.playerAddress && 
          player.playerAddress.toLowerCase() === currentUserAddress
        );
      
      // If they're the creator or already in the room, just load the room
      if (isCreator || isAlreadyInRoom) {
        console.log(`User is ${isCreator ? 'creator' : 'already in'} room ${roomId}, loading directly`);
        loadRoomDetails(roomId);
        setActiveRoomId(roomId);
        return;
      }
      
      // Otherwise, join the room
      console.log(`Joining room ${roomId} with invite code: ${inviteCode}`);
      const success = await joinRoom(roomId, inviteCode);
      
      if (success) {
        setNotification({
          type: 'success',
          message: 'Joined room successfully!'
        });
        
        // Load the room details and enter game
        loadRoomDetails(roomId);
        setActiveRoomId(roomId);
        
        // Refresh balance
        refreshBalance();
      } else {
        setNotification({
          type: 'error',
          message: 'Failed to join room. Please try again.'
        });
      }
    } catch (error: any) {
      console.error("Error joining room:", error);
      setNotification({
        type: 'error',
        message: `Error: ${error.message || 'Failed to join room'}`
      });
    }
  };
  
  // Update room settings
  const updateRoomSettings = (key: string, value: string) => {
    setRoomSettings({
      ...roomSettings,
      [key]: value
    });
  };
  
  // Start join process for a room
  const startJoinRoom = (roomId: number, isPrivate: boolean) => {
    console.log(`Starting join process for room: ${roomId}, isPrivate: ${isPrivate}`);
    
    // Update URL to include room ID without causing navigation
    const url = new URL(window.location.href);
    url.searchParams.set('room', roomId.toString());
    window.history.pushState({}, '', url.toString());
    
    setJoinRoomId(roomId);
    
    if (isPrivate) {
      setShowJoinModal(true);
    } else {
      handleJoinRoom(roomId);
    }
  };
  
  // Improved resetGameSession function to avoid navigation loops
  const resetGameSession = () => {
    console.log("Resetting game session");
    // Clear game state
    setActiveGame(null);
    setActiveRoomId(null);
    setGameSessionData(null);
    setGameScore(null);
    setHasPlayedInRoom(false);
    setGameResult(null);
    
    // Only navigate if we're not already on the games page
    const isOnGamesPage = window.location.pathname === '/games' && 
      !window.location.search.includes('room=');
    
    if (!isOnGamesPage) {
      // Use client-side navigation
      router.push('/games');
    }
  };
  
  // Available games data (static information)
  const availableGames = [
    {
      id: 'flappy-bird',
      title: 'FLAPPY BIRD',
      description: 'Navigate through obstacles and compete for the highest score in this arcade classic.',
      image: '/images/games/flappy-preview.png',
      color: 'blue',
      players: '248',
      rating: 4.8
    },
    {
      id: 'ai-challenge',
      title: 'AI CHALLENGE',
      description: 'Try to trick the AI into saying a specific word within the time limit.',
      image: '/images/games/ai-preview.png',
      color: 'green',
      players: '192',
      rating: 4.5
    },
    {
      id: 'cyber-racer',
      title: 'CYBER RACER',
      description: 'Race against other players in this fast-paced arcade racer.',
      image: '/images/games/cyber-preview.png',
      color: 'pink',
      players: '157',
      rating: 4.2,
      comingSoon: true
    },
    {
      id: 'memory-hacker',
      title: 'MEMORY HACKER',
      description: 'Test your memory skills in this cyberpunk themed game.',
      image: '/images/games/memory-preview.png',
      color: 'purple',
      players: '124',
      rating: 4.3,
      comingSoon: true
    }
  ];
  
  // Add useEffect to periodically refresh room list
  useEffect(() => {
    if (walletConnected && !activeGame) {
      // Initial load
      loadActiveRooms();
      
      // Set up periodic refresh
      const refreshInterval = setInterval(() => {
        if (!activeGame) {
          console.log("Periodically refreshing room list...");
          loadActiveRooms();
        }
      }, 30000); // Refresh every 30 seconds
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [walletConnected, activeGame]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center arcade-bg">
        <div className="loading"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-16 arcade-bg min-h-screen">
      {activeGame ? (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-between items-center mb-6">
            <Link 
              href="/games" 
              className="text-gray-300 hover:text-neon-blue transition-colors"
              onClick={(e) => {
                e.preventDefault();
                resetGameSession();
              }}
            >
              ← Back to Games
            </Link>
            
            {walletConnected && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="arcade-button-green"
                onClick={() => setShowRoomModal(true)}
              >
                CREATE ROOM
              </motion.button>
            )}
          </div>
          
          {/* Notification */}
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-md ${
                notification.type === 'success' 
                  ? 'bg-green-900/30 border border-neon-green text-neon-green' 
                  : notification.type === 'error' ? 'bg-red-900/30 border border-red-500 text-red-400' : 'bg-yellow-900/30 border border-yellow-500 text-yellow-400'
              }`}
            >
              <div className="flex justify-between items-center">
                <p>{notification.message}</p>
                <button 
                  onClick={() => setNotification(null)} 
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
          
          {/* Game session info */}
          {gameSessionData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-black/60 border border-neon-blue rounded-md"
            >
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <h3 className="text-lg font-arcade text-neon-blue">ROOM #{gameSessionData.roomId}</h3>
                  <p className="text-xs text-gray-400">
                    Entry: <span className="text-neon-green">{parseInt(gameSessionData.entryFee).toLocaleString()} points</span> • 
                    Players: <span className="text-neon-pink">{gameSessionData.currentPlayers}/{gameSessionData.maxPlayers}</span>
                  </p>
                </div>
                
                {gameScore !== null && (
                  <div className="text-right">
                    <p className="text-sm text-gray-400">YOUR SCORE</p>
                    <p className="text-2xl font-arcade text-neon-green">{gameScore}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
          
          {/* Game result message */}
          {gameResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mb-6 p-6 rounded-md text-center ${
                gameResult.success 
                  ? 'bg-green-900/30 border-2 border-neon-green' 
                  : 'bg-red-900/30 border-2 border-red-500'
              }`}
            >
              <h3 className={`text-2xl font-arcade mb-2 ${
                gameResult.success ? 'text-neon-green' : 'text-red-400'
              }`}>
                {gameResult.success ? 'VICTORY!' : 'GAME OVER'}
              </h3>
              <p className="text-white mb-4">{gameResult.message}</p>
              
              {gameResult.success && gameResult.winnings && (
                <div className="mb-4">
                  <p className="text-gray-300">Prize Pool:</p>
                  <p className="text-3xl font-arcade text-neon-pink">
                    {parseInt(gameResult.winnings).toLocaleString()} POINTS
                  </p>
                </div>
              )}
              
              {gameResult.success && gameSessionData?.roomId && (
                <button
                  onClick={() => handleClaimPrize(gameSessionData.roomId!)}
                  className="arcade-button-glow-green"
                >
                  CLAIM PRIZE
                </button>
              )}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {activeGame === 'flappy-bird' && (
              <div className="container mx-auto p-4">
                {/* Room info header */}
                {gameSessionData && (
                  <div className="bg-black/50 p-4 mb-6 rounded-md">
                    <h2 className="font-arcade text-xl text-white mb-2">
                      {`Room #${gameSessionData.roomId} - Flappy Bird`}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="text-gray-300">
                        <span className="text-neon-blue">Entry:</span> {parseInt(gameSessionData.entryFee).toLocaleString()} points
                      </div>
                      <div className="text-gray-300">
                        <span className="text-neon-blue">Players:</span> {gameSessionData.currentPlayers}/{gameSessionData.maxPlayers}
                      </div>
                    </div>
                    
                    {/* Creator instructions - show this when the user is the creator and hasn't played yet */}
                    {gameSessionData.isCreator && !hasPlayedInRoom && !gameScore && (
                      <div className="mt-4 p-3 bg-green-900/30 border border-neon-green rounded-md">
                        <p className="text-neon-green font-bold mb-1">You created this room!</p>
                        <p className="text-gray-300 text-sm">As the creator, you need to play and submit a score to set the challenge for other players.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Game result */}
                {gameResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-md ${
                      gameResult.success 
                        ? 'bg-green-900/30 border border-neon-green' 
                        : 'bg-red-900/30 border border-red-500'
                    }`}
                  >
                    <h3 className={`text-xl font-arcade mb-2 ${
                      gameResult.success ? 'text-neon-green' : 'text-red-400'
                    }`}>
                      {gameResult.success ? 'YOU WON!' : 'GAME OVER'}
                    </h3>
                    <p className="text-gray-300 mb-4">{gameResult.message}</p>
                    
                    {gameResult.success && gameResult.winnings && (
                      <div className="mb-6">
                        <p className="text-neon-green text-lg font-arcade">
                          Prize: {parseInt(gameResult.winnings).toLocaleString()} points
                        </p>
                        <button 
                          onClick={() => gameSessionData && handleClaimPrize(gameSessionData.roomId!)}
                          className="arcade-button-green mt-4"
                        >
                          CLAIM PRIZE
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <button
                        onClick={resetGameSession}
                        className="arcade-button-blue"
                      >
                        RETURN TO LOBBY
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {/* Game score */}
                {gameScore !== null && !gameResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-md bg-black/50 border border-neon-blue"
                  >
                    <h3 className="text-xl font-arcade text-neon-blue mb-2">SCORE SUBMITTED</h3>
                    <p className="text-gray-300 mb-2">Your score has been submitted!</p>
                    <p className="text-gray-300">Final Score: <span className="text-neon-pink font-arcade">{gameScore}</span></p>
                    <p className="text-gray-300 mt-4">Waiting for other players to complete the game...</p>
                  </motion.div>
                )}
                
                {/* Game component */}
                <div className="bg-black/30 p-2 md:p-6 rounded-lg border border-neon-blue">
                  <FlappyBird 
                    onGameOver={handleGameOver} 
                    onStart={handleGameStart}
                    disabled={hasPlayedInRoom || gameScore !== null}
                    isCreator={gameSessionData?.isCreator}
                  />
                </div>
              </div>
            )}
            
            {activeGame === 'ai-challenge' && (
              <div className="container mx-auto p-4">
                {/* Room info header */}
                {gameSessionData && (
                  <div className="bg-black/50 p-4 mb-6 rounded-md">
                    <h2 className="font-arcade text-xl text-white mb-2">
                      {`Room #${gameSessionData.roomId} - AI Challenge`}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="text-gray-300">
                        <span className="text-neon-blue">Entry:</span> {parseInt(gameSessionData.entryFee).toLocaleString()} points
                      </div>
                      <div className="text-gray-300">
                        <span className="text-neon-blue">Players:</span> {gameSessionData.currentPlayers}/{gameSessionData.maxPlayers}
                      </div>
                    </div>
                    
                    {/* Creator instructions - show this when the user is the creator and hasn't played yet */}
                    {gameSessionData.isCreator && !hasPlayedInRoom && !gameScore && (
                      <div className="mt-4 p-3 bg-green-900/30 border border-neon-green rounded-md">
                        <p className="text-neon-green font-bold mb-1">You created this room!</p>
                        <p className="text-gray-300 text-sm">As the creator, you need to play and submit a score to set the challenge for other players.</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Game result */}
                {gameResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-6 p-4 rounded-md ${
                      gameResult.success 
                        ? 'bg-green-900/30 border border-neon-green' 
                        : 'bg-red-900/30 border border-red-500'
                    }`}
                  >
                    <h3 className={`text-xl font-arcade mb-2 ${
                      gameResult.success ? 'text-neon-green' : 'text-red-400'
                    }`}>
                      {gameResult.success ? 'YOU WON!' : 'GAME OVER'}
                    </h3>
                    <p className="text-gray-300 mb-4">{gameResult.message}</p>
                    
                    {gameResult.success && gameResult.winnings && (
                      <div className="mb-6">
                        <p className="text-neon-green text-lg font-arcade">
                          Prize: {parseInt(gameResult.winnings).toLocaleString()} points
                        </p>
                        <button 
                          onClick={() => gameSessionData && handleClaimPrize(gameSessionData.roomId!)}
                          className="arcade-button-green mt-4"
                        >
                          CLAIM PRIZE
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-4">
                      <button
                        onClick={resetGameSession}
                        className="arcade-button-blue"
                      >
                        RETURN TO LOBBY
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {/* Game score */}
                {gameScore !== null && !gameResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-md bg-black/50 border border-neon-blue"
                  >
                    <h3 className="text-xl font-arcade text-neon-blue mb-2">SCORE SUBMITTED</h3>
                    <p className="text-gray-300 mb-2">Your score has been submitted!</p>
                    <p className="text-gray-300">Final Score: <span className="text-neon-pink font-arcade">{gameScore}</span></p>
                    <p className="text-gray-300 mt-4">Waiting for other players to complete the game...</p>
                  </motion.div>
                )}
                
                {/* Game component */}
                <AIChallenge 
                  onGameOver={handleGameOver}
                  onStart={handleGameStart}
                  disabled={hasPlayedInRoom || gameScore !== null}
                  isCreator={gameSessionData?.isCreator}
                />
              </div>
            )}
            
            {(activeGame === 'cyber-racer' || activeGame === 'memory-hacker') && (
              <div className="text-center py-16 bg-black/60 border-2 border-neon-blue rounded-lg">
                <h2 className="text-3xl font-arcade neon-text-pink mb-4">COMING SOON</h2>
                <p className="text-gray-300 mb-8">
                  This game is currently in development and will be available soon!
                </p>
                <button
                  onClick={resetGameSession}
                  className="arcade-button-blue"
                >
                  BACK TO GAMES
                </button>
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <div className="container mx-auto px-4 pt-12 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-arcade text-white mb-4">ARCADE GAMES</h1>
            <p className="text-xl text-gray-300">Play, compete, and win CORE tokens</p>
          </motion.div>
          
          {/* Game Selection Grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-arcade neon-text mb-6">SELECT A GAME</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableGames.map((game, index) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  index={index}
                  onClick={() => {
                    if (game.comingSoon) {
                      setNotification({
                        type: 'info',
                        message: 'This game is coming soon!'
                      });
                    } else {
                      setActiveGame(game.id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Active Rooms Section with Improved Debugging */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-arcade neon-text-blue">ACTIVE ROOMS</h2>
              
              {!loadingRooms && (
                <div className="text-xs text-gray-400">
                  {activeRooms.length} room{activeRooms.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>
            
            {walletConnected ? (
              <>
                {loadingRooms ? (
                  <div className="text-center py-16">
                    <div className="loading"></div>
                    <p className="text-gray-400 mt-4">Searching for active rooms...</p>
                  </div>
                ) : activeRooms.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {activeRooms.map((room, index) => {
                      // Generate a truly unique key for this room
                      const uniqueKey = `room-${room.id}-${index}`;
                      
                      return (
                        <RoomCard 
                          key={uniqueKey} 
                          room={room} 
                          index={index}
                          onJoin={() => startJoinRoom(room.id, room.type === 'PRIVATE')}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black/20 rounded-lg border border-gray-800">
                    <p className="text-xl font-arcade text-neon-pink mb-4">NO ACTIVE ROOMS</p>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      There are currently no active game rooms. 
                      Create a new room to start playing!
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-4">
                      <button
                        onClick={() => {
                          // Force a refresh of room data
                          setActiveRooms([]);
                          setLoadingRooms(true);
                          loadActiveRooms();
                        }}
                        className="arcade-button-blue"
                      >
                        REFRESH ROOMS
                      </button>
                      <button
                        onClick={() => setShowRoomModal(true)}
                        className="arcade-button-green"
                      >
                        CREATE ROOM
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-black/20 rounded-lg border border-gray-800">
                <p className="text-xl font-arcade text-neon-pink mb-4">CONNECT YOUR WALLET</p>
                <p className="text-gray-400 mb-8 max-w-md mx-auto">
                  Connect your wallet to see active rooms or create your own!
                </p>
                <button
                  onClick={connectWallet}
                  className="arcade-button-green"
                >
                  CONNECT WALLET
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Create Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-black/90 border-2 border-neon-blue p-6 rounded-md backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-arcade text-neon-blue">CREATE GAME ROOM</h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {!walletConnected ? (
              <div className="text-center p-4">
                <p className="text-neon-pink text-lg mb-4">Wallet Not Connected</p>
                <p className="text-gray-300 mb-6">
                  You need to connect your wallet to create a game room.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowRoomModal(false)}
                    className="arcade-button-red"
                  >
                    CLOSE
                  </button>
                  <button
                    onClick={connectWallet}
                    className="arcade-button-green"
                  >
                    CONNECT WALLET
                  </button>
                </div>
              </div>
            ) : pointsBalance > 0 ? (
              <form onSubmit={handleCreateRoom}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      GAME TYPE
                    </label>
                    <select
                      value={roomSettings.gameType}
                      onChange={(e) => updateRoomSettings('gameType', e.target.value)}
                      className="w-full bg-black border-2 border-neon-green text-white p-2 rounded-md"
                    >
                      <option value="FlappyBird">FLAPPY BIRD</option>
                      <option value="AIChallenge">AI CHALLENGE</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      ENTRY FEE (POINTS)
                    </label>
                    <input
                      type="number"
                      value={roomSettings.entryFee}
                      onChange={(e) => updateRoomSettings('entryFee', e.target.value)}
                      min="10"
                      max={pointsBalance.toString()}
                      className="w-full bg-black border-2 border-neon-pink text-white p-2 rounded-md"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Your balance: {pointsBalance.toLocaleString()} points
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      MAX PLAYERS
                    </label>
                    <select
                      value={roomSettings.maxPlayers}
                      onChange={(e) => updateRoomSettings('maxPlayers', e.target.value)}
                      className="w-full bg-black border-2 border-neon-blue text-white p-2 rounded-md"
                    >
                      <option value="2">2 PLAYERS</option>
                      <option value="4">4 PLAYERS</option>
                      <option value="6">6 PLAYERS</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-arcade text-gray-300 mb-2">
                      ROOM TYPE
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roomType"
                          value="public"
                          checked={roomSettings.roomType === 'public'}
                          onChange={() => updateRoomSettings('roomType', 'public')}
                          className="mr-2"
                        />
                        <span className="text-sm">PUBLIC</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roomType"
                          value="private"
                          checked={roomSettings.roomType === 'private'}
                          onChange={() => updateRoomSettings('roomType', 'private')}
                          className="mr-2"
                        />
                        <span className="text-sm">PRIVATE</span>
                      </label>
                    </div>
                  </div>
                  
                  {roomSettings.roomType === 'private' && (
                    <div>
                      <label className="block text-sm font-arcade text-gray-300 mb-2">
                        INVITE CODE
                      </label>
                      <input
                        type="text"
                        value={roomSettings.inviteCode}
                        onChange={(e) => updateRoomSettings('inviteCode', e.target.value)}
                        className="w-full bg-black border-2 border-neon-green text-white p-2 rounded-md"
                        placeholder="Create a code for your friends"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="pt-4 flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowRoomModal(false)}
                      className="arcade-button-pink"
                    >
                      CANCEL
                    </button>
                    <button
                      type="submit"
                      disabled={gameRoomLoading || parseInt(roomSettings.entryFee) > pointsBalance}
                      className={`arcade-button-green ${
                        gameRoomLoading || parseInt(roomSettings.entryFee) > pointsBalance 
                          ? 'opacity-50 cursor-not-allowed' 
                          : ''
                      }`}
                    >
                      {gameRoomLoading ? 'CREATING...' : 'CREATE ROOM'}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center p-4">
                <p className="text-neon-pink text-lg mb-4">Insufficient Balance</p>
                <p className="text-gray-300 mb-6">
                  You need points to create a game room. Visit your dashboard to convert CORE tokens to points.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowRoomModal(false)}
                    className="arcade-button-red"
                  >
                    CLOSE
                  </button>
                  <button 
                    onClick={() => {
                      setShowRoomModal(false);
                      router.push('/dashboard');
                    }}
                    className="arcade-button-blue"
                  >
                    GO TO DASHBOARD
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal: Join Private Room */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md bg-black/90 border-2 border-neon-blue p-6 rounded-md backdrop-blur-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-arcade text-neon-blue">JOIN PRIVATE ROOM</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {!walletConnected ? (
              <div className="text-center p-4">
                <p className="text-neon-pink text-lg mb-4">Wallet Not Connected</p>
                <p className="text-gray-300 mb-6">
                  You need to connect your wallet to join a game room.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowJoinModal(false)}
                    className="arcade-button-red"
                  >
                    CLOSE
                  </button>
                  <button
                    onClick={connectWallet}
                    className="arcade-button-green"
                  >
                    CONNECT WALLET
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-300 mb-4">
                  This is a private room. Please enter the invite code to join.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-arcade text-gray-300 mb-2">
                    INVITE CODE
                  </label>
                  <input
                    type="text"
                    value={joinInviteCode}
                    onChange={(e) => setJoinInviteCode(e.target.value)}
                    className="w-full bg-black border-2 border-neon-pink text-white p-2 rounded-md"
                    placeholder="Enter invite code"
                  />
                </div>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="arcade-button-pink"
                  >
                    CANCEL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (joinRoomId !== null) {
                        handleJoinRoom(joinRoomId, joinInviteCode);
                        setShowJoinModal(false);
                      }
                    }}
                    disabled={!joinInviteCode || gameRoomLoading}
                    className={`arcade-button-green ${
                      !joinInviteCode || gameRoomLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {gameRoomLoading ? 'JOINING...' : 'JOIN ROOM'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Game Card Component
function GameCard({ game, index, onClick }: { 
  game: {
    id: string;
    title: string;
    description: string;
    image: string;
    color: string;
    players: string;
    rating: number;
    comingSoon?: boolean;
  };
  index: number;
  onClick: () => void;
}) {
  const colorVariants = {
    blue: "border-neon-blue from-neon-blue/20 to-transparent",
    green: "border-neon-green from-neon-green/20 to-transparent",
    pink: "border-neon-pink from-neon-pink/20 to-transparent",
    purple: "border-neon-purple from-neon-purple/20 to-transparent"
  };
  
  const textVariants = {
    blue: "neon-text-blue",
    green: "neon-text-green",
    pink: "neon-text-pink",
    purple: "text-neon-purple"
  };
  
  const buttonVariants = {
    blue: "arcade-button-blue",
    green: "arcade-button-green",
    pink: "arcade-button-pink",
    purple: "bg-neon-purple text-white arcade-button-blue"
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.3 }
      }}
      className={`game-card p-1 bg-gradient-to-br ${colorVariants[game.color as keyof typeof colorVariants]} border-2`}
    >
      <div className="bg-black/80 backdrop-blur-sm p-6 h-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className={`text-xl font-arcade ${textVariants[game.color as keyof typeof textVariants]}`}>{game.title}</h3>
          <div className="flex items-center">
            <div className="text-yellow-400 mr-1">★</div>
            <div className="text-sm font-bold">{game.rating.toFixed(1)}</div>
          </div>
        </div>
        
        <p className="text-gray-300 mb-6 text-sm leading-relaxed">{game.description}</p>
        
        <div className="flex justify-between items-center mb-6">
          <div className="text-xs text-gray-400">
            <span className="mr-1">👤</span> {game.players} active players
          </div>
          
          {game.comingSoon && (
            <div className="bg-black/70 border border-neon-pink text-neon-pink text-xs px-2 py-1 rounded">
              COMING SOON
            </div>
          )}
        </div>
        
        <div className="text-center">
          <button 
            onClick={onClick}
            className={`${buttonVariants[game.color as keyof typeof buttonVariants]} ${game.comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={game.comingSoon}
          >
            {game.comingSoon ? 'COMING SOON' : 'PLAY NOW'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Room Card Component
function RoomCard({ room, index, onJoin }: {
  room: {
    id: number;
    game: string;
    entry: string;
    players: string;
    time: string;
    type: string;
  };
  index: number;
  onJoin: () => void;
}) {
  const typeColors = {
    'PUBLIC': 'text-neon-blue',
    'PRIVATE': 'text-neon-green',
    'TOURNAMENT': 'text-neon-pink'
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="p-1 bg-gradient-to-br from-gray-800/30 to-transparent border border-gray-700"
    >
      <div className="bg-black/80 backdrop-blur-sm p-4 h-full">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-sm font-arcade text-white">{room.game}</div>
            <div className="text-xs text-gray-500">Created {room.time}</div>
          </div>
          <div className={`text-xs font-arcade ${typeColors[room.type as keyof typeof typeColors]} px-2 py-1 border border-current`}>
            {room.type}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="text-xs text-gray-400">ENTRY</div>
            <div className="text-sm font-arcade text-neon-pink">{parseInt(room.entry).toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">PLAYERS</div>
            <div className="text-sm font-arcade text-white">{room.players}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400">ROOM ID</div>
            <div className="text-sm font-arcade text-gray-300">#{room.id}</div>
          </div>
        </div>
        
        <button 
          onClick={onJoin}
          className="w-full py-2 text-xs font-arcade text-center bg-gradient-to-r from-neon-blue to-neon-purple text-black"
        >
          JOIN ROOM
        </button>
      </div>
    </motion.div>
  );
}
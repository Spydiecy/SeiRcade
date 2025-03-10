import { useState, useEffect } from 'react';
import { ethers, BigNumber } from 'ethers';
import { useContracts } from './useContracts';
import { usePrivy } from '@privy-io/react-auth';
import { GameType, RoomType, RoomStatus } from '../constants/contracts';

/**
 * Custom hook for interacting with the GameRoom contract
 * Provides functions for creating rooms, joining games, submitting scores, etc.
 */
export function useGameRoom() {
  const { user } = usePrivy();
  const { gameRoom } = useContracts();
  const [userRooms, setUserRooms] = useState<number[]>([]);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load user's rooms when contract is available
  useEffect(() => {
    if (gameRoom && user?.wallet?.address) {
      getUserRooms(user.wallet.address);
    }
  }, [gameRoom, user?.wallet?.address]);
  
  /**
   * Create a new game room
   * @param entryFee Entry fee in points
   * @param maxPlayers Maximum number of players
   * @param gameType Type of game (0=FlappyBird, 1=AIChallenge)
   * @param roomType Type of room (0=Public, 1=Private, 2=Tournament)
   * @param inviteCode Invite code for private rooms
   * @param expirationTime Custom expiration time (0 for default)
   * @returns Newly created room ID
   */
  const createRoom = async (
    entryFee: string | number,
    maxPlayers: number,
    gameType: number,
    roomType: number,
    inviteCode: string = "",
    expirationTime: number = 0
  ) => {
    if (!gameRoom) {
      setError("Game room contract not initialized");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Convert entry fee to bigint
      const entryFeeAmount = ethers.BigNumber.from(entryFee.toString());
      
      console.log("Creating room with params:", {
        entryFee: entryFeeAmount.toString(),
        maxPlayers,
        gameType,
        roomType,
        inviteCode,
        expirationTime
      });
      
      const tx = await gameRoom.createRoom(
        entryFeeAmount,
        maxPlayers,
        gameType,
        roomType,
        inviteCode,
        expirationTime
      );
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Room creation transaction receipt:", receipt);
      
      // Extract room ID from event
      const event = receipt.events?.find((e: any) => e.event === 'RoomCreated');
      if (!event) {
        throw new Error("Room created but could not find RoomCreated event");
      }
      
      const roomId = event.args.roomId.toNumber();
      console.log("New room created with ID:", roomId);
      
      // Refresh user rooms
      if (user?.wallet?.address) {
        await getUserRooms(user.wallet.address);
      }
      
      return roomId;
    } catch (err: any) {
      console.error("Error creating room:", err);
      setError(err.message || "Failed to create room");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Join an existing game room
   * @param roomId ID of the room to join
   * @param inviteCode Invite code for private rooms
   */
  const joinRoom = async (roomId: number, inviteCode: string = "") => {
    if (!gameRoom) {
      setError("Game room contract not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await gameRoom.joinRoom(roomId, inviteCode);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Room join transaction receipt:", receipt);
      
      // Refresh user rooms
      if (user?.wallet?.address) {
        await getUserRooms(user.wallet.address);
      }
      
      return true;
    } catch (err: any) {
      console.error("Error joining room:", err);
      setError(err.message || "Failed to join room");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Activate a room (transition from Filling to Active)
   * @param roomId ID of the room to activate
   */
  const activateRoom = async (roomId: number) => {
    if (!gameRoom) {
      setError("Game room contract not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`[activateRoom] Attempting to activate room ${roomId}`);
      
      // Check room details first
      const room = await getRoomDetails(roomId);
      
      if (!room) {
        setError(`Room #${roomId} not found`);
        return false;
      }
      
      if (room.status !== 0) { // Not in Filling state
        console.log(`[activateRoom] Room ${roomId} is already in status ${room.status}, no need to activate`);
        return true; // Already active or in another state
      }
      
      // If room exists and is in Filling state, we'll try to activate it by joining
      console.log(`[activateRoom] Room is in Filling state, attempting to activate by joining`);
      
      // We might need to join the room to activate it
      // Or submit a score directly as the creator
      const tx = await gameRoom.activateRoom(roomId);
      const receipt = await tx.wait();
      console.log("[activateRoom] Room activation transaction receipt:", receipt);
      
      return true;
    } catch (err: any) {
      // If there's no activateRoom function, this will fail
      // We'll try to determine if we need to handle it differently
      console.error("[activateRoom] Error activating room:", err);
      
      // Check if the error is because the function doesn't exist
      if (err.message && (
        err.message.includes("method not found") || 
        err.message.includes("is not a function") ||
        err.message.includes("undefined method")
      )) {
        console.log("[activateRoom] activateRoom method not found, will continue with score submission");
        return true; // Continue anyway, since this might be expected
      }
      
      setError(err.message || "Failed to activate room");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Submit a score for a game
   * @param roomId ID of the room
   * @param score Player's score
   */
  const submitScore = async (roomId: number, score: number) => {
    if (!gameRoom) {
      setError("Game room contract not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get room details first
      const room = await getRoomDetails(roomId);
      
      if (!room) {
        setError(`Room #${roomId} not found`);
        return false;
      }
      
      // Check if user is the creator
      const userAddress = user?.wallet?.address?.toLowerCase();
      const isCreator = userAddress && room.creator.toLowerCase() === userAddress;
      
      console.log(`[submitScore] Room ID: ${roomId}, Status: ${room.status}, isCreator: ${isCreator}, maxPlayers: ${room.maxPlayers}, currentPlayers: ${room.currentPlayers}`);
      
      // According to the contract, scores can ONLY be submitted when status is Active (1)
      if (room.status !== 1) { // Not in Active state
        // If room is in Filling state, we need to explain that room must be full before scores can be submitted
        if (room.status === 0) {
          setError(`This room is not active yet. The room must be full (${room.currentPlayers}/${room.maxPlayers} players) before scores can be submitted.`);
        } else {
          setError(`Cannot submit score - room is not in an active state (status: ${room.status})`);
        }
        return false;
      }
      
      // Get all players to detect if others have submitted scores
      const players = await getPlayersInRoom(roomId);
      const playersWithScores = players.filter(player => 
        player && player.hasSubmittedScore).length;
      
      console.log(`[submitScore] Players who have submitted scores: ${playersWithScores}/${room.currentPlayers}`);
      
      // Check if this is the last player submitting a score
      const isLastPlayer = playersWithScores === room.currentPlayers - 1;
      
      console.log(`[submitScore] Submitting score ${score} for room ${roomId}. This ${isLastPlayer ? 'IS' : 'is NOT'} the last player to submit.`);
      
      // Attempt to submit the score
      const tx = await gameRoom.submitScore(roomId, score);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("[submitScore] Score submission transaction receipt:", receipt);
      
      // If this was the last player, the room will transition to Completed
      if (isLastPlayer) {
        console.log("[submitScore] This was the last player to submit a score. Room should now transition to Completed status.");
      } else {
        console.log("[submitScore] Waiting for other players to submit their scores...");
      }
      
      return true;
    } catch (err: any) {
      console.error("[submitScore] Error submitting score:", err);
      
      // Extract the specific error message from the blockchain error
      let errorMessage = "Failed to submit score";
      
      if (err.data && err.data.message) {
        errorMessage = err.data.message;
      } else if (err.error && err.error.data && err.error.data.message) {
        errorMessage = err.error.data.message;
      } else if (err.message) {
        errorMessage = err.message;
        
        // Check for specific error messages
        if (err.message.includes("Game not active")) {
          errorMessage = "The room must be in Active status before scores can be submitted. Active status is reached when the room is full.";
        } else if (err.message.includes("Already played")) {
          errorMessage = "You have already played in this room.";
        }
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Claim prize for winning a game
   * @param roomId ID of the room
   */
  const claimPrize = async (roomId: number) => {
    if (!gameRoom) {
      setError("Game room contract not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await gameRoom.claimPrize(roomId);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Prize claim transaction receipt:", receipt);
      
      return true;
    } catch (err: any) {
      console.error("Error claiming prize:", err);
      setError(err.message || "Failed to claim prize");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get user's active rooms
   * @param address User address (optional, uses connected wallet if not provided)
   */
  const getUserRooms = async (address?: string) => {
    if (!gameRoom) return [];
    const userAddress = address || user?.wallet?.address;
    if (!userAddress) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const rooms = await gameRoom.getPlayerRooms(userAddress);
      
      // Process and deduplicate room IDs
      const rawRoomIds = rooms.map((r: ethers.BigNumber) => r.toNumber());
      
      // Filter out invalid IDs (zeros or negative)
      const validRoomIds = rawRoomIds.filter((id: number) => id > 0);
      
      // Remove duplicates using Set and ensure number[] type
      const uniqueRoomIds: number[] = Array.from(new Set(validRoomIds));
      
      console.log(`Fetched ${rawRoomIds.length} rooms, ${uniqueRoomIds.length} unique valid rooms`);
      
      setUserRooms(uniqueRoomIds);
      return uniqueRoomIds;
    } catch (err: any) {
      console.error("Error getting user rooms:", err);
      setError(err.message || "Failed to get user rooms");
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get details of a specific room
   * @param roomId ID of the room
   */
  const getRoomDetails = async (roomId: number) => {
    if (!gameRoom) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      // Ensure roomId is a proper number
      console.log(`[getRoomDetails] Attempting to get room with ID: ${roomId} (${typeof roomId})`);
      
      if (!roomId || isNaN(roomId) || roomId <= 0) {
        console.error(`[getRoomDetails] Invalid room ID provided: ${roomId}`);
        setError("Invalid room ID provided");
        return null;
      }
      
      // Convert to BigNumber format if needed for the contract
      const numericRoomId = ethers.BigNumber.from(roomId);
      console.log(`[getRoomDetails] Using numeric room ID: ${numericRoomId.toString()}`);
      
      const room = await gameRoom.rooms(numericRoomId);
      console.log(`[getRoomDetails] Room data received:`, room);
      
      // Format room data for easy consumption
      return {
        id: room.id.toNumber(),
        creator: room.creator,
        entryFee: room.entryFee.toString(),
        maxPlayers: room.maxPlayers.toNumber(),
        currentPlayers: room.currentPlayers.toNumber(),
        gameType: room.gameType,
        status: room.status,
        roomType: room.roomType,
        creationTime: room.creationTime.toNumber(),
        expirationTime: room.expirationTime.toNumber(),
        prizePool: room.prizePool.toString(),
        winner: room.winner,
        prizeClaimed: room.prizeClaimed
      };
    } catch (err: any) {
      console.error("Error getting room details:", err);
      setError(err.message || "Failed to get room details");
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Get players in a room with proper data formatting
   * @param roomId ID of the room
   */
  const getPlayersInRoom = async (roomId: number) => {
    if (!gameRoom) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const players = await gameRoom.getPlayers(roomId);
      
      // Safely format player data to ensure it has the expected structure
      const formattedPlayers = Array.isArray(players) ? players.map((player: any) => {
        // Only return valid player entries
        if (!player || typeof player !== 'object') return null;
        
        // Format player data consistently
        return {
          playerAddress: player.playerAddress || null,
          score: typeof player.score === 'number' ? player.score : 0,
          hasSubmittedScore: !!player.hasSubmittedScore,
          timestamp: player.timestamp ? player.timestamp.toNumber() : 0
        };
      }).filter(Boolean) : []; // Remove any null entries
      
      return formattedPlayers;
    } catch (err: any) {
      console.error(`Error getting players in room ${roomId}:`, err);
      setError(err.message || "Failed to get players in room");
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Cancel a room (only creator can cancel)
   * @param roomId ID of the room
   */
  const cancelRoom = async (roomId: number) => {
    if (!gameRoom) {
      setError("Game room contract not initialized");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const tx = await gameRoom.cancelRoom(roomId);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Room cancellation transaction receipt:", receipt);
      
      return true;
    } catch (err: any) {
      console.error("Error canceling room:", err);
      setError(err.message || "Failed to cancel room");
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    userRooms,
    activeRooms,
    loading,
    error,
    createRoom,
    joinRoom,
    activateRoom,
    submitScore,
    claimPrize,
    getUserRooms,
    getRoomDetails,
    getPlayersInRoom,
    cancelRoom,
    GameType,
    RoomType,
    RoomStatus
  };
}

// Re-export enums for convenience
export { GameType, RoomType, RoomStatus };
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
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
   * Submit score for a game
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
      const tx = await gameRoom.submitScore(roomId, score);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log("Score submission transaction receipt:", receipt);
      
      return true;
    } catch (err: any) {
      console.error("Error submitting score:", err);
      setError(err.message || "Failed to submit score");
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
      const roomIds = rooms.map((r: ethers.BigNumber) => r.toNumber());
      setUserRooms(roomIds);
      return roomIds;
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
      const room = await gameRoom.rooms(roomId);
      
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
   * Get players in a room
   * @param roomId ID of the room
   */
  const getPlayersInRoom = async (roomId: number) => {
    if (!gameRoom) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      const players = await gameRoom.getPlayers(roomId);
      return players;
    } catch (err: any) {
      console.error("Error getting players in room:", err);
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
/**
 * eduRcade smart contract addresses
 * TODO: Update these addresses after deploying the contracts on educhain Testnet
 */
export const CONTRACTS = {
    GAME_ROOM: '0x6d04F3DC05473421eF19d91651aFeDA0Fb544b22',
    POINTS_MANAGER: '0xA02530A89Ca64f95669C1e0B2940F1141e2C16ec',
    STATISTICS_TRACKER: '0xEFEf86eCD38E92914aa68AcFA04352960a000a7F'
  };
  
  /**
   * Enum mappings for GameRoom contract
   */
  export const GameType = {
    FlappyBird: 0,
    AIChallenge: 1
  };
  
  export const RoomType = {
    Public: 0,
    Private: 1,
    Tournament: 2
  };
  
  export const RoomStatus = {
    Filling: 0,
    Active: 1,
    Completed: 2,
    Expired: 3,
    Canceled: 4
  };
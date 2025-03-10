/**
 * CoreCade smart contract addresses
 */
export const CONTRACTS = {
    GAME_ROOM: '0xE5CB26Efc8936a526Cc35bd2268267CFa2960B23',
    POINTS_MANAGER: '0x8a82eb09dD84bd90aDE6c89f2FfA4A358DB60fea',
    STATISTICS_TRACKER: '0xB4a19A46988D67621128Dc82c1890543e7deBC58'
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
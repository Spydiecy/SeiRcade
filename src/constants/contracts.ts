/**
 * CoreCade smart contract addresses
 */
export const CONTRACTS = {
    GAME_ROOM: '0x1c1Ab3E81D24cbe718c8092497A1193Ef1521D5A',
    POINTS_MANAGER: '0xE680938E2ce4fd37DCDA6e8AaE6fFbE6810ccaa2',
    STATISTICS_TRACKER: '0xF21937BbA41B2EC7cA35b1829DF30d911c3eA6C6'
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
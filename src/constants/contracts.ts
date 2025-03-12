/**
 * MonCade smart contract addresses
 * TODO: Update these addresses after deploying the contracts on Monad Testnet
 */
export const CONTRACTS = {
    GAME_ROOM: '0x76A7703F3BB0Da34921eCE88CD492eEF9692619b',
    POINTS_MANAGER: '0xF49dC3517eB4Df07502aE5f4bbF32e8AD956B028',
    STATISTICS_TRACKER: '0x79546F0A9545664C7BcB5796e8Dc5fC24A05D7d5'
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
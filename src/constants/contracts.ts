/**
 * CoreCade smart contract addresses
 */
export const CONTRACTS = {
    GAME_ROOM: '0x9d027BCB35A098AC2B732F93d33Fe56970D559F5',
    POINTS_MANAGER: '0xB3529dBb0DE9f565920d74eDC4E93D658814FC05',
    STATISTICS_TRACKER: '0xDADFDDa8A2d0d4C32146a42149851d2C5C92c798'
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
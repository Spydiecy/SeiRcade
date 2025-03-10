/**
 * CoreCade smart contract addresses
 */
export const CONTRACTS = {
    GAME_ROOM: '0x363E92A830c1ed63EBb1081AA2453BA26b708dCF',
    POINTS_MANAGER: '0xB60B41F362BDF3B29af510F329EaC551CD9c7b1c',
    STATISTICS_TRACKER: '0x019759B49c34158b4A1dEb1e751B89472385305C'
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
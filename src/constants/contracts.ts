/**
 * SeiRcade smart contract addresses
 * TODO: Update these addresses after deploying the contracts on Sei Chain Testnet
 */
export const CONTRACTS = {
    GAME_ROOM: '0x49Fa28Fa19cFb67c85a0e7cBFB155D5ae440412E',
    POINTS_MANAGER: '0x94A385a11ac7EdD355FA7AFD2178Fb9933ec9A9c',
    STATISTICS_TRACKER: '0x3ADe135d821101E367762bF2FE36Aee285149Dbe'
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
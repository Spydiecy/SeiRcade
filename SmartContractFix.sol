// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @title GameRoom with Fixed Player Tracking
 * @dev Fixed version of the GameRoom contract with proper player tracking
 */
contract GameRoom is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    
    // Points Manager interface
    interface IPointsManager {
        function transferPoints(address _from, address _to, uint256 _amount) external;
        function transferPointsFromContract(address _to, uint256 _amount) external;
        function getPointsBalance(address _user) external view returns (uint256);
        function platformFee() external view returns (uint256);
        function BASIS_POINTS() external view returns (uint256);
    }
    
    // Statistics Tracker interface
    interface IStatisticsTracker {
        function updateStatistics(
            address _player,
            uint256 _gameType,
            bool _won,
            uint256 _earnings,
            uint256 _score
        ) external;
    }
    
    IPointsManager public pointsManager;
    IStatisticsTracker public statisticsTracker;
    
    // Room status enum
    enum RoomStatus { 
        Filling,    // Room is open and accepting players
        Active,     // Room is full and game is in progress
        Completed,  // Game completed and winner determined
        Expired,    // Room expired without filling
        Canceled    // Room was canceled by creator
    }
    
    // Room visibility type
    enum RoomType {
        Public,     // Open to anyone
        Private,    // Requires invite code
        Tournament  // Special event room
    }
    
    // Game type enum (can be extended)
    enum GameType {
        FlappyBird,
        AIChallenge
    }
    
    // Room structure with improved player tracking
    struct Room {
        uint256 id;                  // Unique room ID
        address creator;             // Room creator
        uint256 entryFee;            // Entry fee in points
        uint256 maxPlayers;          // Maximum number of players
        uint256 currentPlayers;      // Current number of players
        GameType gameType;           // Type of game
        RoomStatus status;           // Current room status
        RoomType roomType;           // Room visibility type
        uint256 creationTime;        // When room was created
        uint256 expirationTime;      // When room expires if not filled
        bytes32 inviteCode;          // Hashed invite code for private rooms
        uint256 prizePool;           // Total prize pool
        address winner;              // Winner of the game
        bool prizeClaimed;           // Whether prize has been claimed
        address[] playerList;        // List of player addresses (NEW)
        mapping(address => bool) players; // Participating players
        mapping(address => uint256) scores; // Player scores
        mapping(address => bool) hasSubmittedScore; // Track who has submitted scores (NEW)
    }
    
    // Room counter
    uint256 private nextRoomId = 1;
    
    // Room expiration time default (1 hour)
    uint256 public defaultExpirationTime = 3600;
    
    // Room storage
    mapping(uint256 => Room) public rooms;
    
    // User's active rooms
    mapping(address => uint256[]) public userRooms;
    
    // Events
    event RoomCreated(uint256 indexed roomId, address indexed creator, GameType gameType, uint256 entryFee, uint256 maxPlayers);
    event PlayerJoined(uint256 indexed roomId, address indexed player);
    event GameStarted(uint256 indexed roomId);
    event ScoreSubmitted(uint256 indexed roomId, address indexed player, uint256 score);
    event WinnerDeclared(uint256 indexed roomId, address indexed winner, uint256 winningScore);
    event PrizeClaimed(uint256 indexed roomId, address indexed winner, uint256 amount);
    event RoomExpired(uint256 indexed roomId);
    event RoomCanceled(uint256 indexed roomId);
    
    /**
     * @dev Initialize the contract with PointsManager address
     * @param _pointsManager Address of the PointsManager contract
     */
    constructor(address _pointsManager) Ownable(msg.sender) ReentrancyGuard() {
        require(_pointsManager != address(0), "Invalid points manager address");
        pointsManager = IPointsManager(payable(_pointsManager));
    }
    
    /**
     * @dev Set the StatisticsTracker address (called by factory)
     * @param _statisticsTracker Address of the StatisticsTracker contract
     */
    function setStatisticsTracker(address _statisticsTracker) external onlyOwner {
        require(_statisticsTracker != address(0), "Invalid statistics tracker address");
        statisticsTracker = IStatisticsTracker(_statisticsTracker);
    }
    
    /**
     * @dev Create a new game room
     * @param _entryFee Entry fee in points
     * @param _maxPlayers Maximum number of players
     * @param _gameType Type of game
     * @param _roomType Type of room (public, private, tournament)
     * @param _inviteCode Invite code for private rooms (empty for public)
     * @param _expirationTime Custom expiration time (0 for default)
     * @return roomId The ID of the created room
     */
    function createRoom(
        uint256 _entryFee,
        uint256 _maxPlayers,
        GameType _gameType,
        RoomType _roomType,
        string calldata _inviteCode,
        uint256 _expirationTime
    ) external nonReentrant returns (uint256 roomId) {
        require(_entryFee > 0, "Entry fee must be greater than zero");
        require(_maxPlayers >= 2 && _maxPlayers <= 10, "Invalid player count");
        require(pointsManager.getPointsBalance(msg.sender) >= _entryFee, "Insufficient points balance");
        
        roomId = nextRoomId++;
        Room storage newRoom = rooms[roomId];
        
        newRoom.id = roomId;
        newRoom.creator = msg.sender;
        newRoom.entryFee = _entryFee;
        newRoom.maxPlayers = _maxPlayers;
        newRoom.currentPlayers = 1; // Creator joins automatically
        newRoom.gameType = _gameType;
        newRoom.status = RoomStatus.Filling;
        newRoom.roomType = _roomType;
        newRoom.creationTime = block.timestamp;
        newRoom.expirationTime = block.timestamp + (_expirationTime > 0 ? _expirationTime : defaultExpirationTime);
        
        // For private rooms, store the hashed invite code
        if (_roomType == RoomType.Private) {
            require(bytes(_inviteCode).length > 0, "Invite code required for private rooms");
            newRoom.inviteCode = keccak256(abi.encodePacked(_inviteCode));
        }
        
        // Add creator as player
        newRoom.players[msg.sender] = true;
        newRoom.playerList.push(msg.sender); // Add to player list
        
        // Transfer entry fee from creator to contract
        pointsManager.transferPoints(msg.sender, address(this), _entryFee);
        
        // Update prize pool
        newRoom.prizePool = _entryFee;
        
        // Add room to creator's active rooms
        userRooms[msg.sender].push(roomId);
        
        emit RoomCreated(roomId, msg.sender, _gameType, _entryFee, _maxPlayers);
        
        return roomId;
    }
    
    /**
     * @dev Join an existing room
     * @param _roomId ID of the room to join
     * @param _inviteCode Invite code for private rooms (ignored for public)
     */
    function joinRoom(uint256 _roomId, string calldata _inviteCode) external nonReentrant {
        Room storage room = rooms[_roomId];
        
        require(room.id > 0, "Room does not exist");
        require(room.status == RoomStatus.Filling, "Room not accepting players");
        require(room.currentPlayers < room.maxPlayers, "Room is full");
        require(!room.players[msg.sender], "Already in this room");
        require(block.timestamp < room.expirationTime, "Room has expired");
        require(pointsManager.getPointsBalance(msg.sender) >= room.entryFee, "Insufficient points balance");
        
        // Check invite code for private rooms
        if (room.roomType == RoomType.Private) {
            require(room.inviteCode == keccak256(abi.encodePacked(_inviteCode)), "Invalid invite code");
        }
        
        // Add player to room
        room.players[msg.sender] = true;
        room.playerList.push(msg.sender); // Add to player list
        room.currentPlayers += 1;
        
        // Transfer entry fee from player to contract
        pointsManager.transferPoints(msg.sender, address(this), room.entryFee);
        
        // Update prize pool
        room.prizePool = room.prizePool.add(room.entryFee);
        
        // Add room to player's active rooms
        userRooms[msg.sender].push(_roomId);
        
        emit PlayerJoined(_roomId, msg.sender);
        
        // If room is now full, change status to Active
        if (room.currentPlayers == room.maxPlayers) {
            room.status = RoomStatus.Active;
            emit GameStarted(_roomId);
        }
    }
    
    /**
     * @dev Submit score for a game
     * @param _roomId ID of the room
     * @param _score Player's score
     */
    function submitScore(uint256 _roomId, uint256 _score) external {
        Room storage room = rooms[_roomId];
        
        require(room.id > 0, "Room does not exist");
        require(room.status == RoomStatus.Active, "Game not active");
        require(room.players[msg.sender], "Not a player in this room");
        require(!room.hasSubmittedScore[msg.sender], "Score already submitted");
        
        // Record the score
        room.scores[msg.sender] = _score;
        room.hasSubmittedScore[msg.sender] = true;
        
        emit ScoreSubmitted(_roomId, msg.sender, _score);
        
        // Check if all players have submitted scores
        bool allScoresSubmitted = true;
        address highestScorer = address(0);
        uint256 highestScore = 0;
        
        // Find player with highest score using the playerList
        for (uint i = 0; i < room.playerList.length; i++) {
            address player = room.playerList[i];
            
            // If any player hasn't submitted, we can't determine winner yet
            if (!room.hasSubmittedScore[player]) {
                allScoresSubmitted = false;
                break;
            }
            
            // Track highest score
            if (room.scores[player] > highestScore) {
                highestScore = room.scores[player];
                highestScorer = player;
            }
        }
        
        // If all scores are in, declare winner
        if (allScoresSubmitted && highestScorer != address(0)) {
            room.winner = highestScorer;
            room.status = RoomStatus.Completed;
            
            emit WinnerDeclared(_roomId, highestScorer, highestScore);
            
            // Update statistics if statistics tracker is set
            if (address(statisticsTracker) != address(0)) {
                // For each player, update their statistics
                for (uint i = 0; i < room.playerList.length; i++) {
                    address player = room.playerList[i];
                    bool isWinner = (player == highestScorer);
                    uint256 earnings = isWinner ? calculateWinnerPrize(room.prizePool) : 0;
                    
                    statisticsTracker.updateStatistics(
                        player,
                        uint256(room.gameType),
                        isWinner,
                        earnings,
                        room.scores[player]
                    );
                }
            }
        }
    }
    
    /**
     * @dev Calculate winner's prize after platform fee
     * @param _prizePool Total prize pool
     * @return prize Winner's prize amount
     */
    function calculateWinnerPrize(uint256 _prizePool) private view returns (uint256 prize) {
        uint256 platformFeeAmount = _prizePool.mul(pointsManager.platformFee()).div(pointsManager.BASIS_POINTS());
        return _prizePool.sub(platformFeeAmount);
    }
    
    /**
     * @dev Claim prize for winning a game
     * @param _roomId ID of the room
     */
    function claimPrize(uint256 _roomId) external nonReentrant {
        Room storage room = rooms[_roomId];
        
        require(room.id > 0, "Room does not exist");
        require(room.status == RoomStatus.Completed, "Game not completed");
        require(room.winner == msg.sender, "Not the winner");
        require(!room.prizeClaimed, "Prize already claimed");
        
        room.prizeClaimed = true;
        
        // Calculate platform fee
        uint256 platformFeeAmount = room.prizePool.mul(pointsManager.platformFee()).div(pointsManager.BASIS_POINTS());
        
        // Calculate winner amount
        uint256 winnerAmount = room.prizePool.sub(platformFeeAmount);
        
        // Transfer prize to winner
        pointsManager.transferPointsFromContract(msg.sender, winnerAmount);
        
        // Transfer fee to platform (PointsManager owner)
        pointsManager.transferPointsFromContract(owner(), platformFeeAmount);
        
        emit PrizeClaimed(_roomId, msg.sender, winnerAmount);
    }
    
    /**
     * @dev Process expired room (refund if not filled)
     * @param _roomId ID of the room
     */
    function processExpiredRoom(uint256 _roomId) external nonReentrant {
        Room storage room = rooms[_roomId];
        
        require(room.id > 0, "Room does not exist");
        require(room.status == RoomStatus.Filling, "Room not in filling state");
        require(block.timestamp >= room.expirationTime, "Room not expired yet");
        
        room.status = RoomStatus.Expired;
        
        // Refund entry fees to all players using playerList
        for (uint i = 0; i < room.playerList.length; i++) {
            address player = room.playerList[i];
            pointsManager.transferPointsFromContract(player, room.entryFee);
        }
        
        emit RoomExpired(_roomId);
    }
    
    /**
     * @dev Cancel a room (only creator can cancel)
     * @param _roomId ID of the room
     */
    function cancelRoom(uint256 _roomId) external nonReentrant {
        Room storage room = rooms[_roomId];
        
        require(room.id > 0, "Room does not exist");
        require(room.status == RoomStatus.Filling, "Can only cancel filling rooms");
        require(room.creator == msg.sender, "Only creator can cancel");
        
        room.status = RoomStatus.Canceled;
        
        // Refund entry fees to all players using playerList
        for (uint i = 0; i < room.playerList.length; i++) {
            address player = room.playerList[i];
            pointsManager.transferPointsFromContract(player, room.entryFee);
        }
        
        emit RoomCanceled(_roomId);
    }
    
    /**
     * @dev Update the default room expiration time (only owner)
     * @param _newExpirationTime New default expiration time in seconds
     */
    function updateDefaultExpirationTime(uint256 _newExpirationTime) external onlyOwner {
        require(_newExpirationTime >= 300, "Expiration time too short");
        defaultExpirationTime = _newExpirationTime;
    }
    
    /**
     * @dev Get players in a room using the playerList
     * @param _roomId ID of the room
     * @return playerList Array of player addresses
     */
    function getPlayers(uint256 _roomId) public view returns (address[] memory) {
        Room storage room = rooms[_roomId];
        require(room.id > 0, "Room does not exist");
        
        return room.playerList;
    }
    
    /**
     * @dev Check if a player has submitted a score
     * @param _roomId ID of the room
     * @param _player Address of the player
     * @return hasSubmitted Whether the player has submitted a score
     */
    function hasPlayerSubmittedScore(uint256 _roomId, address _player) public view returns (bool) {
        Room storage room = rooms[_roomId];
        require(room.id > 0, "Room does not exist");
        
        return room.hasSubmittedScore[_player];
    }
    
    /**
     * @dev Get score of a player in a room
     * @param _roomId ID of the room
     * @param _player Address of the player
     * @return score Player's score
     */
    function getPlayerScore(uint256 _roomId, address _player) public view returns (uint256) {
        Room storage room = rooms[_roomId];
        require(room.id > 0, "Room does not exist");
        
        return room.scores[_player];
    }
    
    /**
     * @dev Get the count of players who have submitted scores
     * @param _roomId ID of the room
     * @return count Number of players who have submitted scores
     */
    function getSubmittedScoreCount(uint256 _roomId) public view returns (uint256) {
        Room storage room = rooms[_roomId];
        require(room.id > 0, "Room does not exist");
        
        uint256 count = 0;
        for (uint i = 0; i < room.playerList.length; i++) {
            if (room.hasSubmittedScore[room.playerList[i]]) {
                count++;
            }
        }
        
        return count;
    }
    
    /**
     * @dev Get all active rooms for a player
     * @param _player Address of the player
     * @return roomIds Array of room IDs
     */
    function getPlayerRooms(address _player) external view returns (uint256[] memory) {
        return userRooms[_player];
    }
} 
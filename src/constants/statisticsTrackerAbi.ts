/**
 * StatisticsTracker contract ABI
 * You'll need to paste the complete ABI here
 */
const STATISTICS_TRACKER_ABI = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_gameRoomContract",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "gameType",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "bool",
				"name": "won",
				"type": "bool"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "earnings",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "score",
				"type": "uint256"
			}
		],
		"name": "StatisticsUpdated",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "dailyEarnings",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "dailyWins",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "gameRoomContract",
		"outputs": [
			{
				"internalType": "contract GameRoom",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "gameStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalPlayed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPrizePool",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "averageEntryFee",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "highestScore",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "highestScorer",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			}
		],
		"name": "getDailyStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "wins",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "earnings",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_timestamp",
				"type": "uint256"
			}
		],
		"name": "getDayTimestamp",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "dayStart",
				"type": "uint256"
			}
		],
		"stateMutability": "pure",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_gameType",
				"type": "uint256"
			}
		],
		"name": "getGameStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "totalPlayed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalPrizePool",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "highestScore",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "highestScorer",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_count",
				"type": "uint256"
			}
		],
		"name": "getMostActive",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "result",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			}
		],
		"name": "getPlayerStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "gamesPlayed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "gamesWon",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalEarnings",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "winRate",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "highestScore",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getTodayTimestamp",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "dayStart",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_count",
				"type": "uint256"
			}
		],
		"name": "getTopEarners",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "result",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "mostActive",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "playerStats",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "gamesPlayed",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "gamesWon",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalEarnings",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "highestScore",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "lastGameTimestamp",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "topEarners",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_player",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "_gameType",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "_won",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "_earnings",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_score",
				"type": "uint256"
			}
		],
		"name": "updateStatistics",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
  
export default STATISTICS_TRACKER_ABI;
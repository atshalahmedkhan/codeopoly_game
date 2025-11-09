/**
 * CodeOpoly Game Manager
 * Integrates the CodeOpoly game engine with Socket.IO for real-time multiplayer
 */

import GameEngine from './gameEngine.js';
import { TILE_TYPES } from './tiles.js';
import { calculateRentServer, getChallengeRewardServer, resolveBankruptcyServer } from './gameLogicAdapter.js';

class CodeopolyGameManager {
  constructor() {
    this.activeGames = new Map(); // gameId -> GameEngine instance
  }

  createGame(gameId, playerNames) {
    const gameEngine = new GameEngine(playerNames);
    this.activeGames.set(gameId, gameEngine);
    
    // Set up event listeners
    this.setupGameEventListeners(gameId, gameEngine);
    
    return gameEngine;
  }

  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  removeGame(gameId) {
    const game = this.activeGames.get(gameId);
    if (game) {
      game.gameActive = false;
      this.activeGames.delete(gameId);
    }
  }

  setupGameEventListeners(gameId, gameEngine) {
    // Game events will be emitted through the event emitter
    // These can be forwarded to Socket.IO in the socket handlers
  }

  async rollDice(gameId, playerId) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    
    if (game.players[game.currentPlayerIndex].id !== playerId) {
      throw new Error('Not your turn');
    }

    // Roll dice
    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const total = dice1 + dice2;
    
    // Calculate new position
    const oldPosition = player.position;
    const newPosition = (oldPosition + total) % game.board.length;
    const passedGo = newPosition < oldPosition;
    
    // Update position
    player.position = newPosition;
    
    // Handle passing GO
    if (passedGo) {
      player.cash += 200;
      game.actionLog.push({
        type: 'passedGo',
        playerId,
        amount: 200,
        message: `${player.name} passed GO and collected $200!`
      });
    }

    // Get tile information
    const tile = game.board[newPosition];
    
    return {
      dice: [dice1, dice2],
      total,
      newPosition,
      oldPosition,
      passedGo,
      tile,
      playerCash: player.cash
    };
  }

  async handleTileAction(gameId, playerId, action, data = {}) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const player = game.players.find(p => p.id === playerId);
    if (!player) throw new Error('Player not found');
    
    const tile = game.board[player.position];
    
    switch (tile.type) {
      case TILE_TYPES.PROPERTY:
        return this.handlePropertyAction(game, player, tile, action, data);
        
      case TILE_TYPES.CODE_DUEL:
        return this.handleCodeDuelAction(game, player, data);
        
      case TILE_TYPES.SYSTEM_CRASH:
        return this.handleSystemCrashAction(game, player);
        
      case TILE_TYPES.CODE_REVIEW:
        return this.handleCodeReviewAction(game, player);
        
      case TILE_TYPES.HACKATHON:
        return this.handleHackathonAction(game, player);
        
      default:
        return { success: true, message: 'No action required' };
    }
  }

  async handlePropertyAction(game, player, property, action, data) {
    if (property.owner === null) {
      // Unowned property
      switch (action) {
        case 'buy':
          if (player.cash >= property.price) {
            player.cash -= property.price;
            property.owner = player.id;
            player.properties.push(property.id);
            
            return {
              success: true,
              type: 'propertyPurchased',
              propertyId: property.id,
              playerId: player.id,
              price: property.price,
              playerCash: player.cash,
              message: `${player.name} purchased ${property.name} for $${property.price}!`
            };
          } else {
            return {
              success: false,
              message: 'Insufficient funds!'
            };
          }
          
        case 'challenge':
          // This should trigger a coding challenge modal
          const reward = getChallengeRewardServer(property.difficulty);
          return {
            success: true,
            type: 'challengeStarted',
            propertyId: property.id,
            difficulty: property.difficulty,
            reward: reward,
            message: `${player.name} is attempting the coding challenge!`
          };
          
        case 'skip':
          return {
            success: true,
            type: 'propertySkipped',
            message: `${player.name} skipped ${property.name}`
          };
      }
    } else if (property.owner !== player.id) {
      // Pay rent
      const owner = game.players.find(p => p.id === property.owner);
      const rent = calculateRentServer(property);
      
      if (player.cash >= rent) {
        player.cash -= rent;
        owner.cash += rent;
        
        return {
          success: true,
          type: 'rentPaid',
          fromPlayerId: player.id,
          toPlayerId: owner.id,
          amount: rent,
          playerCash: player.cash,
          ownerCash: owner.cash,
          message: `${player.name} paid $${rent} rent to ${owner.name}!`
        };
      } else {
        // Player goes bankrupt - use unified bankruptcy logic
        const result = resolveBankruptcyServer(player, owner, game.board);
        
        return {
          success: true,
          type: 'bankruptcy',
          playerId: player.id,
          creditorId: owner.id,
          transferredProperties: result.transferredProperties,
          message: `${player.name} went bankrupt! Properties transferred to ${owner.name}.`
        };
      }
    } else {
      // Own property
      return {
        success: true,
        type: 'ownProperty',
        message: `${player.name} landed on their own property`
      };
    }
  }

  async submitChallengeSolution(gameId, playerId, propertyId, code, language) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const player = game.players.find(p => p.id === playerId);
    const property = game.board.find(tile => tile.id === propertyId);
    
    if (!player || !property) throw new Error('Invalid challenge submission');
    
    // For now, simulate challenge success based on difficulty
    const successRates = { easy: 0.7, medium: 0.5, hard: 0.3 };
    const success = Math.random() < (successRates[property.difficulty] || 0.5);
    
    if (success) {
      const reward = getChallengeRewardServer(property.difficulty);
      
      property.owner = player.id;
      player.properties.push(property.id);
      player.cash += reward;
      player.solvedChallenges++;
      
      return {
        success: true,
        type: 'challengeCompleted',
        passed: true,
        propertyId: property.id,
        playerId: player.id,
        reward,
        playerCash: player.cash,
        message: `${player.name} solved the challenge and earned ${property.name} + $${reward}!`
      };
    } else {
      player.cash -= 100; // Penalty for failure
      
      return {
        success: true,
        type: 'challengeCompleted',
        passed: false,
        playerId: player.id,
        penalty: 100,
        playerCash: player.cash,
        message: `${player.name} failed the challenge and lost $100!`
      };
    }
  }

  async handleCodeDuelAction(game, player, data) {
    const { opponentId } = data;
    const opponent = opponentId ? 
      game.players.find(p => p.id === opponentId) :
      game.players.filter(p => p.active && p.id !== player.id)[
        Math.floor(Math.random() * game.players.filter(p => p.active && p.id !== player.id).length)
      ];
    
    if (!opponent) {
      return {
        success: false,
        message: 'No opponents available for Code Duel'
      };
    }
    
    // Start a code duel
    return {
      success: true,
      type: 'codeDuelStarted',
      challengerId: player.id,
      challengedId: opponent.id,
      message: `${player.name} challenges ${opponent.name} to a Code Duel!`
    };
  }

  async resolveCodeDuel(gameId, winnerId, loserId) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    const winner = game.players.find(p => p.id === winnerId);
    const loser = game.players.find(p => p.id === loserId);
    
    if (!winner || !loser) throw new Error('Invalid duel resolution');
    
    winner.cash += 1000;
    loser.cash = Math.max(0, loser.cash - 300);
    
    if (loser.cash <= 0) {
      loser.active = false;
    }
    
    return {
      success: true,
      type: 'codeDuelResolved',
      winnerId,
      loserId,
      winnerCash: winner.cash,
      loserCash: loser.cash,
      loserBankrupt: !loser.active,
      message: `${winner.name} won the Code Duel! +$1000 / ${loser.name} -$300`
    };
  }

  async handleSystemCrashAction(game, player) {
    player.skipNextTurn = true;
    
    return {
      success: true,
      type: 'systemCrash',
      playerId: player.id,
      message: `${player.name} hit a System Crash and will skip their next turn!`
    };
  }

  async handleCodeReviewAction(game, player) {
    const events = [
      { message: "Your code passed all test cases!", amount: 300 },
      { message: "Merge conflict detected!", amount: -150 },
      { message: "Syntax error found!", amount: -100 },
      { message: "Successfully refactored a teammate's code!", amount: 200 },
      { message: "Found and fixed a critical bug!", amount: 400 },
      { message: "Code review rejected - needs refactoring!", amount: -200 }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    player.cash = Math.max(0, player.cash + event.amount);
    
    if (player.cash <= 0) {
      player.active = false;
    }
    
    return {
      success: true,
      type: 'codeReview',
      playerId: player.id,
      amount: event.amount,
      playerCash: player.cash,
      playerBankrupt: !player.active,
      message: `${player.name}: ${event.message}`
    };
  }

  async handleHackathonAction(game, player) {
    const activePlayers = game.players.filter(p => p.active);
    if (activePlayers.length < 2) {
      return {
        success: false,
        message: 'Not enough players for a hackathon'
      };
    }
    
    // Randomly split into teams
    const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, mid);
    const team2 = shuffled.slice(mid);
    
    // Determine winner
    const team1Wins = Math.random() < 0.5;
    
    // Apply rewards/penalties
    if (team1Wins) {
      team1.forEach(p => p.cash += 500);
      team2.forEach(p => {
        p.cash = Math.max(0, p.cash - 200);
        if (p.cash <= 0) p.active = false;
      });
    } else {
      team2.forEach(p => p.cash += 500);
      team1.forEach(p => {
        p.cash = Math.max(0, p.cash - 200);
        if (p.cash <= 0) p.active = false;
      });
    }
    
    return {
      success: true,
      type: 'hackathon',
      team1: team1.map(p => ({ id: p.id, name: p.name, cash: p.cash })),
      team2: team2.map(p => ({ id: p.id, name: p.name, cash: p.cash })),
      winningTeam: team1Wins ? 1 : 2,
      message: `Hackathon complete! Team ${team1Wins ? 1 : 2} wins!`
    };
  }

  nextTurn(gameId) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    // Check if current player should skip
    const currentPlayer = game.players[game.currentPlayerIndex];
    if (currentPlayer.skipNextTurn) {
      currentPlayer.skipNextTurn = false;
    }
    
    // Move to next active player
    do {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    } while (!game.players[game.currentPlayerIndex].active && 
             game.players.some(p => p.active));
    
    // Check if round is complete
    if (game.currentPlayerIndex === 0) {
      game.currentRound++;
      
      // Check game end conditions
      if (game.currentRound > game.maxRounds) {
        return this.endGame(gameId);
      }
    }
    
    // Check for game over (only one active player)
    const activePlayers = game.players.filter(p => p.active);
    if (activePlayers.length <= 1) {
      return this.endGame(gameId);
    }
    
    return {
      success: true,
      type: 'turnChanged',
      currentPlayerId: game.players[game.currentPlayerIndex].id,
      currentRound: game.currentRound,
      skipTurn: game.players[game.currentPlayerIndex].skipNextTurn
    };
  }

  endGame(gameId) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    // Calculate final scores
    const finalScores = game.players.map(player => {
      const propertyValue = player.properties.reduce((sum, propId) => {
        const property = game.board.find(tile => tile.id === propId);
        return sum + (property ? property.price : 0);
      }, 0);
      
      return {
        playerId: player.id,
        playerName: player.name,
        cash: player.cash,
        properties: player.properties.length,
        propertyValue,
        challenges: player.solvedChallenges,
        netWorth: player.cash + propertyValue + (player.solvedChallenges * 50),
        active: player.active
      };
    }).sort((a, b) => b.netWorth - a.netWorth);
    
    // Determine awards
    const awards = {
      winner: finalScores[0],
      bestCoder: finalScores.reduce((best, player) => 
        player.challenges > best.challenges ? player : best
      ),
      techMogul: finalScores.reduce((best, player) => 
        player.properties > best.properties ? player : best
      ),
      topInvestor: finalScores.reduce((best, player) => 
        player.cash > best.cash ? player : best
      )
    };
    
    game.gameActive = false;
    
    return {
      success: true,
      type: 'gameEnded',
      finalScores,
      awards,
      rounds: game.currentRound,
      message: `Game Over! ${awards.winner.playerName} wins with $${awards.winner.netWorth}!`
    };
  }

  getGameState(gameId) {
    const game = this.getGame(gameId);
    if (!game) throw new Error('Game not found');
    
    return {
      players: game.players.map(p => ({
        id: p.id,
        name: p.name,
        cash: p.cash,
        position: p.position,
        properties: p.properties,
        challenges: p.solvedChallenges,
        active: p.active,
        skipNextTurn: p.skipNextTurn,
        color: p.color,
        avatar: p.avatar
      })),
      board: game.board,
      currentTurn: game.players[game.currentPlayerIndex]?.id,
      currentRound: game.currentRound,
      maxRounds: game.maxRounds,
      gameActive: game.gameActive,
      actionLog: game.actionLog.slice(-10) // Last 10 actions
    };
  }
}

// Singleton instance
const gameManager = new CodeopolyGameManager();

export default gameManager;

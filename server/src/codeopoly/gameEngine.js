/**
 * CodeOpoly Game Engine
 * Main game logic controller for the Monopoly-inspired coding game
 */

import { createPlayer } from './players.js';
import { createBoard, TILE_TYPES } from './tiles.js';
import { simulateChallenge } from './challenges.js';
import { EventEmitter } from 'events';
import { calculateRentServer, getChallengeRewardServer } from './gameLogicAdapter.js';

class GameEngine extends EventEmitter {
  constructor(playerNames = ['Alice', 'Bob', 'Charlie', 'David']) {
    super();
    this.players = [];
    this.board = createBoard();
    this.currentRound = 1;
    this.currentPlayerIndex = 0;
    this.gameActive = true;
    this.maxRounds = 5;
    this.startTime = Date.now();
    this.maxGameTime = 60 * 60 * 1000; // 60 minutes in milliseconds
    this.actionLog = [];
    
    // Initialize players
    this.initializePlayers(playerNames);
    
    console.log('🎮 CodeOpoly Game Initialized!');
    console.log(`Players: ${this.players.map(p => p.name).join(', ')}`);
    console.log(`Starting cash: $${this.players[0].cash}`);
    console.log('═'.repeat(50));
  }

  initializePlayers(names) {
    names.forEach((name, index) => {
      const player = createPlayer(name, index);
      this.players.push(player);
    });
  }

  rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }

  movePlayer(player, steps) {
    const oldPosition = player.position;
    player.position = (player.position + steps) % this.board.length;
    
    // Check if passed START (position 0)
    if (player.position < oldPosition) {
      this.updateCash(player, 200);
      this.log(`💰 ${player.name} passed START and collected $200!`);
    }
    
    const tile = this.board[player.position];
    this.log(`${player.name} moved ${steps} spaces to ${tile.name} (Position ${player.position})`);
    
    return tile;
  }

  updateCash(player, amount) {
    player.cash += amount;
    if (amount > 0) {
      this.log(`💵 ${player.name} gained $${amount} (Balance: $${player.cash})`);
    } else {
      this.log(`💸 ${player.name} lost $${Math.abs(amount)} (Balance: $${player.cash})`);
    }
    
    // Check for bankruptcy
    if (player.cash < 0) {
      player.active = false;
      this.log(`🚫 ${player.name} is BANKRUPT and out of the game!`);
    }
  }

  transferOwnership(property, player) {
    property.owner = player.id;
    player.properties.push(property.id);
    this.log(`🏢 ${player.name} now owns ${property.name}!`);
  }

  async handleTileAction(player, tile) {
    if (!player.active) return;
    
    switch(tile.type) {
      case TILE_TYPES.PROPERTY:
        await this.handlePropertyTile(player, tile);
        break;
        
      case TILE_TYPES.CODE_DUEL:
        await this.handleCodeDuel(player);
        break;
        
      case TILE_TYPES.SYSTEM_CRASH:
        await this.handleSystemCrash(player);
        break;
        
      case TILE_TYPES.CODE_REVIEW:
        await this.handleCodeReview(player);
        break;
        
      case TILE_TYPES.HACKATHON:
        await this.handleHackathon();
        break;
        
      case TILE_TYPES.START:
        this.log(`${player.name} is at START position`);
        break;
        
      default:
        this.log(`${player.name} landed on ${tile.name}`);
    }
  }

  async handlePropertyTile(player, property) {
    if (property.owner === null) {
      // Unowned property
      this.log(`🏢 ${property.name} is available!`);
      this.log(`   Price: $${property.price} | Difficulty: ${property.difficulty}`);
      
      // Simulate player decision
      const decision = this.simulatePropertyDecision(player, property);
      
      if (decision === 'buy' && player.cash >= property.price) {
        this.updateCash(player, -property.price);
        this.transferOwnership(property, player);
        
      } else if (decision === 'challenge') {
        this.log(`🧠 ${player.name} attempts to solve the coding challenge!`);
        const success = simulateChallenge(property.difficulty);
        
        if (success) {
          const reward = getChallengeRewardServer(property.difficulty);
          
          this.log(`✅ ${player.name} solved the challenge successfully!`);
          this.transferOwnership(property, player);
          this.updateCash(player, reward);
          player.solvedChallenges++;
          
        } else {
          this.log(`❌ ${player.name} failed the challenge!`);
          this.updateCash(player, -100);
        }
        
      } else {
        this.log(`⏭️  ${player.name} skipped ${property.name}`);
      }
      
    } else if (property.owner !== player.id) {
      // Owned by another player - pay rent using unified calculation
      const owner = this.players.find(p => p.id === property.owner);
      const rent = calculateRentServer(property);
      
      this.log(`🏠 ${property.name} is owned by ${owner.name}`);
      this.updateCash(player, -rent);
      this.updateCash(owner, rent);
      this.log(`💰 ${player.name} paid $${rent} rent to ${owner.name}`);
    } else {
      this.log(`🏠 ${player.name} landed on their own property`);
    }
  }

  async handleCodeDuel(player) {
    const activePlayers = this.players.filter(p => p.active && p.id !== player.id);
    if (activePlayers.length === 0) {
      this.log(`⚔️ No other players available for Code Duel`);
      return;
    }
    
    const opponent = activePlayers[Math.floor(Math.random() * activePlayers.length)];
    this.log(`⚔️ CODE DUEL: ${player.name} vs ${opponent.name}!`);
    
    // Simulate duel outcome (50/50 chance)
    const playerWins = Math.random() < 0.5;
    
    if (playerWins) {
      this.log(`🏆 ${player.name} wins the Code Duel!`);
      this.updateCash(player, 1000);
      this.updateCash(opponent, -300);
    } else {
      this.log(`🏆 ${opponent.name} wins the Code Duel!`);
      this.updateCash(player, -300);
      this.updateCash(opponent, 1000);
    }
  }

  async handleSystemCrash(player) {
    player.skipNextTurn = true;
    this.log(`🐛 SYSTEM CRASH! ${player.name} is debugging and will skip their next turn!`);
  }

  async handleCodeReview(player) {
    const events = [
      { message: "Your code passed all test cases!", amount: 300 },
      { message: "Merge conflict detected!", amount: -150 },
      { message: "Syntax error found!", amount: -100 },
      { message: "Successfully refactored a teammate's code!", amount: 200 },
      { message: "Found and fixed a critical bug!", amount: 400 },
      { message: "Code review rejected - needs refactoring!", amount: -200 }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    this.log(`📝 CODE REVIEW: ${event.message}`);
    this.updateCash(player, event.amount);
  }

  async handleHackathon() {
    this.log(`🏆 HACKATHON EVENT!`);
    
    const activePlayers = this.players.filter(p => p.active);
    if (activePlayers.length < 2) {
      this.log(`Not enough players for a hackathon`);
      return;
    }
    
    // Randomly split into teams
    const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
    const mid = Math.ceil(shuffled.length / 2);
    const team1 = shuffled.slice(0, mid);
    const team2 = shuffled.slice(mid);
    
    this.log(`Team 1: ${team1.map(p => p.name).join(', ')}`);
    this.log(`Team 2: ${team2.map(p => p.name).join(', ')}`);
    
    // Simulate hackathon outcome
    const team1Wins = Math.random() < 0.5;
    
    if (team1Wins) {
      this.log(`🥇 Team 1 wins the hackathon!`);
      team1.forEach(p => this.updateCash(p, 500));
      team2.forEach(p => this.updateCash(p, -200));
    } else {
      this.log(`🥇 Team 2 wins the hackathon!`);
      team2.forEach(p => this.updateCash(p, 500));
      team1.forEach(p => this.updateCash(p, -200));
    }
  }

  simulatePropertyDecision(player, property) {
    // Simple AI: Buy if affordable and random chance
    if (player.cash >= property.price * 1.5 && Math.random() < 0.5) {
      return 'buy';
    } else if (Math.random() < 0.3) {
      return 'challenge';
    }
    return 'skip';
  }

  async playTurn() {
    const player = this.players[this.currentPlayerIndex];
    
    if (!player.active) {
      this.log(`${player.name} is bankrupt and skips their turn`);
      return;
    }
    
    if (player.skipNextTurn) {
      this.log(`${player.name} is still debugging and skips this turn`);
      player.skipNextTurn = false;
      return;
    }
    
    this.log(`\n🎯 ${player.name}'s turn (Cash: $${player.cash})`);
    
    // Roll dice
    const diceRoll = this.rollDice();
    this.log(`🎲 ${player.name} rolled a ${diceRoll}`);
    
    // Move player
    const tile = this.movePlayer(player, diceRoll);
    
    // Handle tile action
    await this.handleTileAction(player, tile);
  }

  async playRound() {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`ROUND ${this.currentRound} BEGINS!`);
    console.log(`${'='.repeat(50)}`);
    
    // Play all player turns
    for (let i = 0; i < this.players.length; i++) {
      this.currentPlayerIndex = i;
      await this.playTurn();
    }
    
    // Show round summary
    this.showRoundSummary();
    
    this.currentRound++;
  }

  showRoundSummary() {
    console.log(`\n--- Round ${this.currentRound} Summary ---`);
    this.players.forEach(player => {
      const netWorth = this.calculateNetWorth(player);
      console.log(`${player.name}: Cash: $${player.cash}, Properties: ${player.properties.length}, Net Worth: $${netWorth}`);
    });
  }

  calculateNetWorth(player) {
    let netWorth = player.cash;
    
    // Add property values
    player.properties.forEach(propId => {
      const property = this.board.find(tile => tile.id === propId);
      if (property) netWorth += property.price;
    });
    
    // Add challenge bonus
    netWorth += player.solvedChallenges * 50;
    
    return netWorth;
  }

  async startGame() {
    console.log('\n🚀 Starting CodeOpoly Game!\n');
    
    while (this.gameActive && this.currentRound <= this.maxRounds) {
      // Check time limit
      const elapsedTime = Date.now() - this.startTime;
      if (elapsedTime >= this.maxGameTime) {
        this.log('⏰ Time limit reached! Ending game...');
        break;
      }
      
      await this.playRound();
      
      // Small delay between rounds for readability
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    this.endGame();
  }

  endGame() {
    console.log(`\n${'='.repeat(50)}`);
    console.log('🏁 GAME OVER!');
    console.log(`${'='.repeat(50)}\n`);
    
    // Calculate final scores
    const finalScores = this.players.map(player => ({
      player,
      netWorth: this.calculateNetWorth(player)
    })).sort((a, b) => b.netWorth - a.netWorth);
    
    // Announce winner
    const winner = finalScores[0];
    console.log(`🏆 WINNER: ${winner.player.name} with a net worth of $${winner.netWorth}!`);
    
    // Show final standings
    console.log('\n📊 Final Standings:');
    finalScores.forEach((score, index) => {
      console.log(`${index + 1}. ${score.player.name}: $${score.netWorth}`);
    });
    
    // Special awards
    console.log('\n🏅 Special Awards:');
    
    // Best Coder
    const bestCoder = this.players.reduce((best, player) => 
      player.solvedChallenges > best.solvedChallenges ? player : best
    );
    console.log(`🧠 Best Coder: ${bestCoder.name} (${bestCoder.solvedChallenges} challenges solved)`);
    
    // Tech Mogul
    const techMogul = this.players.reduce((best, player) => 
      player.properties.length > best.properties.length ? player : best
    );
    console.log(`🏢 Tech Mogul: ${techMogul.name} (${techMogul.properties.length} properties)`);
    
    // Investor
    const investor = this.players.reduce((best, player) => 
      player.cash > best.cash ? player : best
    );
    console.log(`💰 Top Investor: ${investor.name} ($${investor.cash} in cash)`);
    
    this.gameActive = false;
    
    return {
      winner: winner.player.name,
      finalScores: finalScores.map(s => ({
        name: s.player.name,
        netWorth: s.netWorth,
        cash: s.player.cash,
        properties: s.player.properties.length,
        challenges: s.player.solvedChallenges
      })),
      awards: {
        bestCoder: bestCoder.name,
        techMogul: techMogul.name,
        topInvestor: investor.name
      }
    };
  }

  log(message) {
    console.log(message);
    this.actionLog.push({
      round: this.currentRound,
      message,
      timestamp: Date.now()
    });
  }
}

export default GameEngine;

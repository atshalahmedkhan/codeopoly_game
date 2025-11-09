/**
 * CodeOpoly Test Script
 * Demonstrates the game with custom settings
 */

import GameEngine from './gameEngine.js';

async function testGame() {
  console.log('🧪 Running CodeOpoly Test Game...\n');
  
  // Create game with custom players
  const testPlayers = ['Alice (Frontend Dev)', 'Bob (Backend Expert)', 'Charlie (Full Stack)', 'David (DevOps Pro)'];
  const game = new GameEngine(testPlayers);
  
  // You can modify game settings here if needed
  // game.maxRounds = 3; // Shorter game for testing
  
  // Run the game
  await game.startGame();
  
  // Show some interesting statistics
  console.log('\n📊 Detailed Game Analysis:');
  
  // Property distribution
  console.log('\n🏢 Property Ownership:');
  game.board.filter(tile => tile.type === 'PROPERTY' && tile.owner !== null).forEach(property => {
    const owner = game.players.find(p => p.id === property.owner);
    console.log(`• ${property.name} - Owned by ${owner.name} ($${property.price})`);
  });
  
  // Challenge statistics
  console.log('\n🧠 Challenge Performance:');
  game.players.forEach(player => {
    if (player.solvedChallenges > 0) {
      console.log(`• ${player.name}: ${player.solvedChallenges} challenges solved`);
    }
  });
  
  // Bankruptcies
  const bankruptPlayers = game.players.filter(p => !p.active);
  if (bankruptPlayers.length > 0) {
    console.log('\n💸 Bankruptcies:');
    bankruptPlayers.forEach(player => {
      console.log(`• ${player.name} went bankrupt!`);
    });
  }
}

// Run the test
testGame().catch(console.error);

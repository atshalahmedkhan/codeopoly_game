/**
 * CodeOpoly Simulation Runner
 * Main entry point to run the game simulation
 */

import GameEngine from './gameEngine.js';

async function runSimulation(playerNames = ['Alice', 'Bob', 'Charlie', 'David']) {
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║                    🎮 CODEOPOLY 🎮                   ║
║          Where Code Meets Capitalism!                 ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  console.log('📋 Game Rules:');
  console.log('• 5 rounds of competitive coding and property trading');
  console.log('• Start with $1500 in cash');
  console.log('• Buy properties or solve coding challenges');
  console.log('• Pay rent when landing on owned properties');
  console.log('• Special events: Code Duels, Hackathons, and more!');
  console.log('• Winner: Highest net worth after 5 rounds\n');

  // Create and start game
  const game = new GameEngine(playerNames);
  
  // Add a small delay before starting
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Run the game
  const results = await game.startGame();
  
  // Display final statistics
  console.log('\n📈 Game Statistics:');
  console.log(`Total actions logged: ${game.actionLog.length}`);
  console.log(`Game duration: ${Math.floor((Date.now() - game.startTime) / 1000)} seconds`);
  
  return results;
}

// Run the simulation if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (process.argv[1] === __filename) {
  // You can customize player names here
  const customPlayers = process.argv.slice(2);
  const players = customPlayers.length >= 2 ? customPlayers : undefined;
  
  runSimulation(players).then(() => {
    console.log('\n✅ Simulation complete!');
  }).catch(error => {
    console.error('❌ Simulation error:', error);
  });
}

export { runSimulation };

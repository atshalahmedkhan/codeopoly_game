/**
 * CodeOpoly - Main Entry Point
 * A Monopoly-inspired coding game combining property trading with LeetCode challenges
 */

import { runSimulation } from './simulation.js';
import GameEngine from './gameEngine.js';
import * as tiles from './tiles.js';
import * as players from './players.js';
import * as challenges from './challenges.js';

// Export all modules for potential UI integration
export {
  GameEngine,
  tiles,
  players,
  challenges,
  runSimulation
};

// If running directly, start a game simulation
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  console.log('Starting CodeOpoly simulation...\n');
  runSimulation();
}

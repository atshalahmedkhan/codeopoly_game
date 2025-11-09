/**
 * Game Constants
 * Centralized configuration for game rules and mechanics
 */

// Currency rewards
export const PASS_GO_REWARD = 200;
export const BANKRUPTCY_PENALTY = 0;

// Challenge difficulty rewards
export const DIFFICULTY_REWARDS = {
  easy: 200,
  medium: 400,
  hard: 700,
} as const;

// Challenge failure penalty
export const CHALLENGE_FAILURE_PENALTY = 100;

// Rent calculation
export const RENT_MULTIPLIER_PER_HOUSE = 1.0; // Linear scaling
export const DEFAULT_RENT_PERCENTAGE = 0.2; // Fallback if rent fields not defined

// Property upgrade limits
export const MAX_HOUSES = 4; // 4 houses = hotel

// Turn management
export const JAIL_TURNS = 3;

// Game board
export const BOARD_SIZE = 40;

// Time limits (in seconds)
export const CODE_DUEL_TIME_LIMIT = 300; // 5 minutes
export const CHALLENGE_TIME_LIMIT = 300; // 5 minutes

// Bankruptcy transfer policy
export const BANKRUPTCY_TRANSFER_TO_CREDITOR = true;

export type Difficulty = 'easy' | 'medium' | 'hard';

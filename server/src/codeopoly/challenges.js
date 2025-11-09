/**
 * CodeOpoly Challenge System
 * Simulates LeetCode-style coding challenges
 */

const CHALLENGE_SUCCESS_RATES = {
  easy: 0.7,      // 70% success rate
  medium: 0.5,    // 50% success rate
  hard: 0.3       // 30% success rate
};

const CHALLENGE_REWARDS = {
  easy: 200,
  medium: 400,
  hard: 700
};

const CHALLENGE_THEMES = {
  easy: [
    'Implement a function to reverse a string',
    'Find the maximum element in an array',
    'Check if a number is prime',
    'Count vowels in a string',
    'FizzBuzz implementation'
  ],
  medium: [
    'Implement binary search',
    'Find duplicates in an array',
    'Validate balanced parentheses',
    'Implement a linked list',
    'Two sum problem'
  ],
  hard: [
    'Implement quicksort algorithm',
    'Solve the N-Queens problem',
    'Find longest substring without repeating characters',
    'Implement a trie data structure',
    'Dynamic programming - knapsack problem'
  ]
};

function simulateChallenge(difficulty) {
  const successRate = CHALLENGE_SUCCESS_RATES[difficulty] || 0.5;
  return Math.random() < successRate;
}

function getChallengeDescription(difficulty) {
  const themes = CHALLENGE_THEMES[difficulty] || CHALLENGE_THEMES.medium;
  return themes[Math.floor(Math.random() * themes.length)];
}

function getChallengeReward(difficulty) {
  return CHALLENGE_REWARDS[difficulty] || 200;
}

export {
  simulateChallenge,
  getChallengeDescription,
  getChallengeReward,
  CHALLENGE_SUCCESS_RATES,
  CHALLENGE_REWARDS
};

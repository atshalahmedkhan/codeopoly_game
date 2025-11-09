import { GameState, Player, Property, CodeDuel, Problem } from '@/types/game';
import { 
  Player as UnifiedPlayer, 
  Property as UnifiedProperty, 
  GameState as UnifiedGameState,
  BankruptcyResult,
  TurnResult,
  PropertyActionResult
} from './types/gameLogic';
import { 
  PASS_GO_REWARD, 
  DIFFICULTY_REWARDS, 
  MAX_HOUSES,
  BANKRUPTCY_TRANSFER_TO_CREDITOR,
  DEFAULT_RENT_PERCENTAGE,
  Difficulty
} from './constants';
import { getRandomProblem } from './problems';

export function rollDice(): [number, number] {
  return [
    Math.floor(Math.random() * 6) + 1,
    Math.floor(Math.random() * 6) + 1,
  ];
}

export function movePlayer(player: Player, diceRoll: [number, number], boardSize: number = 40): Player {
  const totalMove = diceRoll[0] + diceRoll[1];
  let newPosition = (player.position + totalMove) % boardSize;
  
  // Handle passing Go
  if (player.position + totalMove >= boardSize) {
    return {
      ...player,
      position: newPosition,
      money: player.money + PASS_GO_REWARD, // Pass Go, collect $200
    };
  }
  
  return {
    ...player,
    position: newPosition,
  };
}

/**
 * Unified rent calculation supporting houses and hotels
 * Uses rent fields from property definition with linear scaling for houses
 * This is the single source of truth for rent calculation
 */
export function calculateRent(property: Property | UnifiedProperty): number {
  // Railroads and utilities have special rent logic
  if (property.isRailroad || property.isUtility) {
    return property.rent;
  }

  // Standard properties
  if (property.houses === 0) {
    return property.rent;
  } else if (property.houses >= 4) {
    // 4 houses = hotel
    return property.rentWithHotel;
  } else {
    // Linear interpolation for houses 1-3
    const houseRent = property.rentWithHouse;
    const baseRent = property.rent;
    return baseRent + (houseRent - baseRent) * (property.houses / 4);
  }
}

export function canBuyProperty(player: Player, property: Property): boolean {
  return player.money >= property.price && !property.ownerId;
}

export function buyProperty(player: Player, property: Property): { player: Player; property: Property } {
  return {
    player: {
      ...player,
      money: player.money - property.price,
      properties: [...player.properties, property.id],
    },
    property: {
      ...property,
      ownerId: player.id,
    },
  };
}

export function payRent(player: Player, property: Property, owner: Player): Player {
  const rent = calculateRent(property);
  return {
    ...player,
    money: player.money - rent,
  };
}

export function receiveRent(owner: Player, rent: number): Player {
  return {
    ...owner,
    money: owner.money + rent,
  };
}

export function createCodeDuel(
  challengerId: string,
  defenderId: string,
  property: Property,
  problem: Problem
): CodeDuel {
  return {
    id: `duel-${Date.now()}`,
    challengerId,
    defenderId,
    propertyId: property.id,
    problem,
    challengerCode: problem.starterCode,
    defenderCode: problem.starterCode,
    challengerSolved: false,
    defenderSolved: false,
    startTime: Date.now(),
    timeLimit: 300, // 5 minutes
    status: 'active',
  };
}

export function checkDuelWinner(duel: CodeDuel): CodeDuel {
  const now = Date.now();
  const elapsed = (now - duel.startTime) / 1000;
  
  // Check for timeout
  if (elapsed >= duel.timeLimit) {
    if (duel.challengerSolved && !duel.defenderSolved) {
      return { ...duel, status: 'challenger-won' };
    } else if (duel.defenderSolved && !duel.challengerSolved) {
      return { ...duel, status: 'defender-won' };
    } else {
      // Both solved or neither solved - defender wins by default
      return { ...duel, status: 'defender-won' };
    }
  }
  
  // Check if someone solved first
  if (duel.challengerSolved && !duel.defenderSolved) {
    return { ...duel, status: 'challenger-won', challengerTime: elapsed };
  } else if (duel.defenderSolved && !duel.challengerSolved) {
    return { ...duel, status: 'defender-won', defenderTime: elapsed };
  } else if (duel.challengerSolved && duel.defenderSolved) {
    // Both solved - faster one wins
    if (duel.challengerTime! < duel.defenderTime!) {
      return { ...duel, status: 'challenger-won' };
    } else {
      return { ...duel, status: 'defender-won' };
    }
  }
  
  return duel;
}

export function getNextPlayer(currentPlayerId: string, players: Player[]): string {
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  const nextIndex = (currentIndex + 1) % players.length;
  return players[nextIndex].id;
}

export function checkGameOver(gameState: GameState): { isOver: boolean; winnerId?: string } {
  const activePlayers = gameState.players.filter(p => p.isActive && p.money > 0);
  
  if (activePlayers.length === 1) {
    return { isOver: true, winnerId: activePlayers[0].id };
  }
  
  if (activePlayers.length === 0) {
    // Find player with most net worth
    const playersWithNetWorth = gameState.players.map(player => ({
      player,
      netWorth: calculateNetWorth(player, gameState.properties),
    }));
    playersWithNetWorth.sort((a, b) => b.netWorth - a.netWorth);
    return { isOver: true, winnerId: playersWithNetWorth[0].player.id };
  }
  
  return { isOver: false };
}

export function calculateNetWorth(player: Player, properties: Property[]): number {
  const ownedProperties = properties.filter(p => p.ownerId === player.id);
  const propertyValue = ownedProperties.reduce((sum, prop) => {
    return sum + prop.price + (prop.houses * prop.houseCost);
  }, 0);
  return player.money + propertyValue;
}

export function canUpgradeProperty(player: Player, property: Property): boolean {
  if (property.ownerId !== player.id) return false;
  if (property.houses >= MAX_HOUSES) return false; // Already has hotel
  if (player.money < property.houseCost) return false;
  return true;
}

export function upgradeProperty(player: Player, property: Property): { player: Player; property: Property } {
  return {
    player: {
      ...player,
      money: player.money - property.houseCost,
    },
    property: {
      ...property,
      houses: property.houses + 1,
    },
  };
}

/**
 * Resolve bankruptcy - unified handling for client and server
 * Transfers properties to creditor if exists, otherwise resets to bank
 */
export function resolveBankruptcy(
  bankruptPlayer: Player | UnifiedPlayer, 
  creditor: (Player | UnifiedPlayer) | null,
  allProperties: (Property | UnifiedProperty)[]
): BankruptcyResult {
  const ownedPropertyIds = bankruptPlayer.properties || [];
  const transferredProperties: string[] = [];

  // Update properties based on bankruptcy transfer policy
  for (const propId of ownedPropertyIds) {
    const property = allProperties.find(p => p.id === propId);
    if (property) {
      if (BANKRUPTCY_TRANSFER_TO_CREDITOR && creditor) {
        // Transfer to creditor
        property.ownerId = creditor.id;
        if (!creditor.properties) creditor.properties = [];
        if (!creditor.properties.includes(propId)) {
          creditor.properties.push(propId);
        }
      } else {
        // Reset to bank (unowned)
        property.ownerId = undefined;
        property.houses = 0;
      }
      transferredProperties.push(propId);
    }
  }

  // Update bankrupt player
  const updatedBankruptPlayer = {
    ...bankruptPlayer,
    money: 0,
    isActive: false,
    properties: [],
  };

  return {
    bankruptPlayer: updatedBankruptPlayer as Player,
    creditor: creditor as Player | undefined,
    transferredProperties,
  };
}

/**
 * Advance turn to next active player
 * Handles skip flags, bankrupt players, and round tracking
 */
export function advanceTurn(
  players: (Player | UnifiedPlayer)[],
  currentPlayerId: string,
  currentRound: number = 0
): TurnResult {
  const skippedPlayers: string[] = [];
  let roundIncremented = false;
  
  const currentIndex = players.findIndex(p => p.id === currentPlayerId);
  if (currentIndex === -1) {
    throw new Error('Current player not found');
  }

  // Filter active players
  const activePlayers = players.filter(p => p.isActive !== false);
  if (activePlayers.length === 0) {
    throw new Error('No active players');
  }

  let nextIndex = (currentIndex + 1) % players.length;
  let attempts = 0;
  const maxAttempts = players.length;

  // Find next active player who is not skipping
  while (attempts < maxAttempts) {
    const nextPlayer = players[nextIndex];
    
    // Check if we wrapped around (new round)
    if (nextIndex <= currentIndex && attempts > 0) {
      roundIncremented = true;
    }

    // Check if player is active
    if (nextPlayer.isActive === false) {
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
      continue;
    }

    // Check if player should skip
    if (nextPlayer.skipNextTurn) {
      skippedPlayers.push(nextPlayer.id);
      nextPlayer.skipNextTurn = false;
      nextIndex = (nextIndex + 1) % players.length;
      attempts++;
      continue;
    }

    // Found next valid player
    return {
      nextPlayerId: nextPlayer.id,
      skippedPlayers,
      roundIncremented,
    };
  }

  // Fallback to first active player if we couldn't find anyone
  const firstActive = activePlayers[0];
  return {
    nextPlayerId: firstActive.id,
    skippedPlayers,
    roundIncremented: true,
  };
}

/**
 * Get challenge reward based on difficulty
 */
export function getChallengeReward(difficulty: Difficulty | string): number {
  const diffKey = difficulty as Difficulty;
  return DIFFICULTY_REWARDS[diffKey] || DIFFICULTY_REWARDS.medium;
}

/**
 * Perform property landing action - determines what actions are available
 * This is called when a player lands on a property tile
 */
export function performPropertyLanding(
  player: Player | UnifiedPlayer,
  property: Property | UnifiedProperty,
  owner?: Player | UnifiedPlayer
): PropertyActionResult {
  // Unowned property - can buy or challenge
  if (!property.ownerId) {
    if (player.money >= property.price) {
      return {
        action: 'buy',
        success: true,
        message: `${player.name} can buy ${property.name} for $${property.price}`,
      };
    } else {
      return {
        action: 'skip',
        success: false,
        message: `${player.name} cannot afford ${property.name} (costs $${property.price})`,
      };
    }
  }

  // Own property - no action needed
  if (property.ownerId === player.id) {
    return {
      action: 'own',
      success: true,
      message: `${player.name} landed on their own property`,
    };
  }

  // Must pay rent to owner
  const rent = calculateRent(property);
  return {
    action: 'rent',
    success: player.money >= rent,
    message: player.money >= rent 
      ? `${player.name} must pay $${rent} rent to ${owner?.name || 'owner'}`
      : `${player.name} cannot pay $${rent} rent - BANKRUPTCY!`,
    updates: {
      player: { money: player.money - rent },
      creditor: owner ? { money: (owner.money || 0) + rent } : undefined,
    },
  };
}


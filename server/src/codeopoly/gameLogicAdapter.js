/**
 * Server-side adapter for shared game logic
 * Wraps unified game logic functions for use in server codebase
 * Handles conversion between server's cash/active fields and shared money/isActive fields
 */

// Note: When running with tsx, this will import the TS file directly
// When compiled, ensure lib is built first or use a proper module resolution

/**
 * Convert server player format to unified format
 */
export function toUnifiedPlayer(serverPlayer) {
  return {
    ...serverPlayer,
    money: serverPlayer.cash,
    isActive: serverPlayer.active,
  };
}

/**
 * Convert unified player format back to server format
 */
export function toServerPlayer(unifiedPlayer) {
  return {
    ...unifiedPlayer,
    cash: unifiedPlayer.money,
    active: unifiedPlayer.isActive !== false,
  };
}

/**
 * Convert server property format to unified format
 */
export function toUnifiedProperty(serverProperty) {
  return {
    ...serverProperty,
    ownerId: serverProperty.owner,
  };
}

/**
 * Convert unified property format back to server format  
 */
export function toServerProperty(unifiedProperty) {
  return {
    ...unifiedProperty,
    owner: unifiedProperty.ownerId,
  };
}

/**
 * Calculate rent using unified logic
 * This is the single source of truth for rent calculation
 */
export function calculateRentServer(property) {
  // Import the unified calculateRent function
  // For now, implement the unified logic directly to avoid import issues
  
  // Railroads and utilities have special rent logic
  if (property.isRailroad || property.isUtility) {
    return property.rent || 0;
  }

  // Standard properties
  if (!property.houses || property.houses === 0) {
    return property.rent || 0;
  } else if (property.houses >= 4) {
    // 4 houses = hotel
    return property.rentWithHotel || property.rent || 0;
  } else {
    // Linear interpolation for houses 1-3
    const houseRent = property.rentWithHouse || property.rent || 0;
    const baseRent = property.rent || 0;
    return baseRent + (houseRent - baseRent) * (property.houses / 4);
  }
}

/**
 * Get challenge reward based on difficulty
 */
export function getChallengeRewardServer(difficulty) {
  const DIFFICULTY_REWARDS = {
    easy: 200,
    medium: 400,
    hard: 700,
  };
  return DIFFICULTY_REWARDS[difficulty] || DIFFICULTY_REWARDS.medium;
}

/**
 * Resolve bankruptcy with unified logic
 */
export function resolveBankruptcyServer(bankruptPlayer, creditor, allProperties) {
  const ownedPropertyIds = bankruptPlayer.properties || [];
  const transferredProperties = [];

  // Transfer properties to creditor or reset to bank
  for (const propId of ownedPropertyIds) {
    const property = allProperties.find(p => p.id === propId);
    if (property) {
      if (creditor) {
        // Transfer to creditor
        property.owner = creditor.id;
        if (!creditor.properties) creditor.properties = [];
        if (!creditor.properties.includes(propId)) {
          creditor.properties.push(propId);
        }
      } else {
        // Reset to bank (unowned)
        property.owner = null;
        property.houses = 0;
      }
      transferredProperties.push(propId);
    }
  }

  // Update bankrupt player
  bankruptPlayer.cash = 0;
  bankruptPlayer.active = false;
  bankruptPlayer.properties = [];

  return {
    bankruptPlayer,
    creditor,
    transferredProperties,
  };
}

/**
 * Advance turn to next active player
 */
export function advanceTurnServer(players, currentPlayerIndex) {
  const skippedPlayers = [];
  let nextIndex = currentPlayerIndex;
  let attempts = 0;
  const maxAttempts = players.length;

  // Find next active player who is not skipping
  while (attempts < maxAttempts) {
    nextIndex = (nextIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];
    
    // Check if player is active
    if (!nextPlayer.active) {
      attempts++;
      continue;
    }

    // Check if player should skip
    if (nextPlayer.skipNextTurn) {
      skippedPlayers.push(nextPlayer.id);
      nextPlayer.skipNextTurn = false;
      attempts++;
      continue;
    }

    // Found next valid player
    return {
      nextIndex,
      nextPlayerId: nextPlayer.id,
      skippedPlayers,
      roundIncremented: nextIndex <= currentPlayerIndex && attempts > 0,
    };
  }

  // Fallback to first active player
  const firstActiveIndex = players.findIndex(p => p.active);
  if (firstActiveIndex === -1) {
    throw new Error('No active players');
  }

  return {
    nextIndex: firstActiveIndex,
    nextPlayerId: players[firstActiveIndex].id,
    skippedPlayers,
    roundIncremented: true,
  };
}

/**
 * CodeOpoly Player Management
 * Handles player creation and state
 */

const PLAYER_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#F7DC6F'];
const PLAYER_AVATARS = ['👨‍💻', '👩‍💻', '🧑‍💻', '💻'];

function createPlayer(name, index) {
  return {
    id: index,
    name: name,
    cash: 1500,
    position: 0,
    properties: [],
    solvedChallenges: 0,
    score: 0,
    color: PLAYER_COLORS[index % PLAYER_COLORS.length],
    avatar: PLAYER_AVATARS[index % PLAYER_AVATARS.length],
    active: true,
    skipNextTurn: false
  };
}

function getPlayerStats(player, board) {
  const propertyValues = player.properties.reduce((sum, propId) => {
    const property = board.find(tile => tile.id === propId);
    return sum + (property ? property.price : 0);
  }, 0);
  
  return {
    name: player.name,
    cash: player.cash,
    propertyCount: player.properties.length,
    propertyValues: propertyValues,
    solvedChallenges: player.solvedChallenges,
    netWorth: player.cash + propertyValues + (player.solvedChallenges * 50),
    active: player.active
  };
}

export {
  createPlayer,
  getPlayerStats,
  PLAYER_COLORS,
  PLAYER_AVATARS
};

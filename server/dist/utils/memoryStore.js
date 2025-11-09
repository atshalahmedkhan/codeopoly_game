const games = new Map();
export function saveGame(game) {
    const gameData = {
        _id: game._id || `game-${Date.now()}`,
        roomCode: game.roomCode,
        status: game.status,
        players: game.players,
        currentTurn: game.currentTurn,
        turnNumber: game.turnNumber,
        startTime: game.startTime,
        boardState: game.boardState,
        activeDuel: game.activeDuel,
    };
    games.set(gameData._id, gameData);
    return gameData;
}
export function findGameById(id) {
    return games.get(id) || null;
}
export function findGameByRoomCode(roomCode) {
    const upperCode = roomCode.toUpperCase().trim();
    for (const game of games.values()) {
        if (game.roomCode && game.roomCode.toUpperCase() === upperCode) {
            return game;
        }
    }
    return null;
}
export function updateGame(id, updates) {
    const game = games.get(id);
    if (!game)
        return null;
    const updated = { ...game, ...updates };
    games.set(id, updated);
    return updated;
}
export function getAllGames() {
    return Array.from(games.values());
}
//# sourceMappingURL=memoryStore.js.map
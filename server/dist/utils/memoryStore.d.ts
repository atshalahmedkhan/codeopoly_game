interface GameData {
    _id: string;
    roomCode: string;
    status: string;
    players: any[];
    currentTurn: string;
    turnNumber: number;
    startTime: Date;
    boardState: any[];
    activeDuel?: any;
}
export declare function saveGame(game: any): GameData;
export declare function findGameById(id: string): GameData | null;
export declare function findGameByRoomCode(roomCode: string): GameData | null;
export declare function updateGame(id: string, updates: Partial<GameData>): GameData | null;
export declare function getAllGames(): GameData[];
export {};
//# sourceMappingURL=memoryStore.d.ts.map
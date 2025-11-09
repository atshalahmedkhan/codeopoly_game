import mongoose, { Document } from 'mongoose';
export interface IProperty {
    id: string;
    name: string;
    position: number;
    price: number;
    rent: number;
    rentWithHouse: number[];
    rentWithHotel: number;
    houseCost: number;
    color: string;
    category: string;
    ownerId?: string;
    houses: number;
    isRailroad?: boolean;
    isUtility?: boolean;
    isSpecial?: boolean;
    specialType?: 'go' | 'jail' | 'free-parking' | 'go-to-jail' | 'chance' | 'community-chest';
}
export interface IPlayer {
    id: string;
    name: string;
    avatar: string;
    position: number;
    money: number;
    properties: string[];
    inJail: boolean;
    jailTurns: number;
    socketId?: string;
}
export interface IDuel {
    id: string;
    challengerId: string;
    defenderId: string;
    propertyId: string;
    problemId: string;
    startTime: Date;
    status: 'active' | 'challenger-won' | 'defender-won' | 'timeout';
}
export interface IGame extends Document {
    roomCode: string;
    status: 'waiting' | 'active' | 'finished';
    players: IPlayer[];
    currentTurn: string;
    turnNumber: number;
    startTime?: Date;
    endTime?: Date;
    boardState: IProperty[];
    activeDuel?: IDuel;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Game: mongoose.Model<IGame, {}, {}, {}, mongoose.Document<unknown, {}, IGame, {}, {}> & IGame & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Game.d.ts.map
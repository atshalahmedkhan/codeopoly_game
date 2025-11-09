// import mongoose, { Schema, Document } from 'mongoose';

// export interface IProperty {
//   id: string;
//   name: string;
//   position: number;
//   price: number;
//   rent: number;
//   rentWithHouse: number[];
//   rentWithHotel: number;
//   houseCost: number;
//   color: string;
//   category: string; // Allow any category string
//   ownerId?: string;
//   houses: number; // 0-4 (4 = hotel)
//   isRailroad?: boolean;
//   isUtility?: boolean;
//   isSpecial?: boolean;
//   specialType?: 'go' | 'jail' | 'free-parking' | 'go-to-jail' | 'chance' | 'community-chest';
// }

// export interface IPlayer {
//   id: string;
//   name: string;
//   avatar: string;
//   position: number;
//   money: number;
//   properties: string[]; // Property IDs
//   inJail: boolean;
//   jailTurns: number;
//   socketId?: string;
// }

// export interface IGame extends Document {
//   roomCode: string;
//   status: 'waiting' | 'in-progress' | 'finished';
//   players: IPlayer[];
//   currentTurn: string; // Player ID
//   turnNumber: number;
//   startTime: Date;
//   boardState: IProperty[];
//   activeDuel?: {
//     id: string;
//     challengerId: string;
//     defenderId: string;
//     propertyId: string;
//     problemId: string;
//     startTime: Date;
//     status: 'active' | 'challenger-won' | 'defender-won' | 'timeout';
//   };
//   createdAt: Date;
//   updatedAt: Date;
// }

// const PropertySchema = new Schema<IProperty>({
//   id: { type: String, required: true },
//   name: { type: String, required: true },
//   position: { type: Number, required: true },
//   price: { type: Number, required: true },
//   rent: { type: Number, required: true },
//   rentWithHouse: [Number],
//   rentWithHotel: { type: Number, required: true },
//   houseCost: { type: Number, required: true },
//   color: { type: String, required: true },
//   category: { type: String, required: true },
//   ownerId: String,
//   houses: { type: Number, default: 0 },
//   isRailroad: Boolean,
//   isUtility: Boolean,
//   isSpecial: Boolean,
//   specialType: String,
// });

// const PlayerSchema = new Schema<IPlayer>({
//   id: { type: String, required: true },
//   name: { type: String, required: true },
//   avatar: { type: String, required: true },
//   position: { type: Number, default: 0 },
//   money: { type: Number, default: 1500 },
//   properties: [String],
//   inJail: { type: Boolean, default: false },
//   jailTurns: { type: Number, default: 0 },
//   socketId: String,
// });

// const GameSchema = new Schema<IGame>({
//   roomCode: { type: String, required: true, unique: true, uppercase: true },
//   status: { type: String, enum: ['waiting', 'in-progress', 'finished'], default: 'waiting' },
//   players: [PlayerSchema],
//   currentTurn: String,
//   turnNumber: { type: Number, default: 1 },
//   startTime: Date,
//   boardState: [PropertySchema],
//   activeDuel: {
//     id: String,
//     challengerId: String,
//     defenderId: String,
//     propertyId: String,
//     problemId: String,
//     startTime: Date,
//     status: String,
//   },
// }, {
//   timestamps: true,
// });

// export const Game = mongoose.model<IGame>('Game', GameSchema);

import mongoose, { Schema, Document } from 'mongoose';

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
  houses: number; // 0-4 houses, 5 = hotel
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
  properties: string[]; // Property IDs
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
  currentTurn: string; // Player ID
  turnNumber: number;
  startTime?: Date;
  endTime?: Date;
  boardState: IProperty[];
  activeDuel?: IDuel;
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IProperty>({
  id: { 
    type: String, 
    required: true,
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100,
  },
  position: { 
    type: Number, 
    required: true,
    min: 0,
    max: 39, // Standard Monopoly board has 40 spaces (0-39)
  },
  price: { 
    type: Number, 
    required: true,
    min: 0,
    max: 10000,
  },
  rent: { 
    type: Number, 
    required: true,
    min: 0,
  },
  rentWithHouse: {
    type: [Number],
    default: [],
    validate: {
      validator: function(arr: number[]) {
        return arr.length <= 4; // Max 4 houses before hotel
      },
      message: 'Cannot have more than 4 house rent values'
    }
  },
  rentWithHotel: { 
    type: Number, 
    required: true,
    min: 0,
  },
  houseCost: { 
    type: Number, 
    required: true,
    min: 0,
  },
  color: { 
    type: String, 
    required: true,
    trim: true,
  },
  category: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 50,
  },
  ownerId: {
    type: String,
    default: null,
  },
  houses: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5, // 0-4 houses, 5 = hotel
  },
  isRailroad: { 
    type: Boolean, 
    default: false 
  },
  isUtility: { 
    type: Boolean, 
    default: false 
  },
  isSpecial: { 
    type: Boolean, 
    default: false 
  },
  specialType: { 
    type: String,
    enum: ['go', 'jail', 'free-parking', 'go-to-jail', 'chance', 'community-chest', null],
    default: null,
  },
}, { _id: false }); // Don't create _id for subdocuments

const PlayerSchema = new Schema<IPlayer>({
  id: { 
    type: String, 
    required: true,
  },
  name: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 50,
  },
  avatar: { 
    type: String, 
    required: true,
    maxlength: 10,
    default: '💻',
  },
  position: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 39,
  },
  money: { 
    type: Number, 
    default: 1500,
    min: 0,
  },
  properties: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr: string[]) {
        return arr.length <= 28; // Max properties a player can own
      },
      message: 'Player cannot own more than 28 properties'
    }
  },
  inJail: { 
    type: Boolean, 
    default: false 
  },
  jailTurns: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 3, // Max 3 turns in jail
  },
  socketId: {
    type: String,
    default: null,
  },
}, { _id: false });

const DuelSchema = new Schema<IDuel>({
  id: { 
    type: String, 
    required: true 
  },
  challengerId: { 
    type: String, 
    required: true 
  },
  defenderId: { 
    type: String, 
    required: true 
  },
  propertyId: { 
    type: String, 
    required: true 
  },
  problemId: { 
    type: String, 
    required: true 
  },
  startTime: { 
    type: Date, 
    required: true,
    default: Date.now,
  },
  status: { 
    type: String,
    enum: ['active', 'challenger-won', 'defender-won', 'timeout'],
    default: 'active',
    required: true,
  },
}, { _id: false });

const GameSchema = new Schema<IGame>({
  roomCode: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true,
    trim: true,
    length: 6, // Assuming 6-character room codes
    index: true, // Add index for faster lookups
  },
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'finished'], 
    default: 'waiting',
    required: true,
  },
  players: {
    type: [PlayerSchema],
    validate: {
      validator: function(arr: IPlayer[]) {
        return arr.length >= 1 && arr.length <= 4;
      },
      message: 'Game must have between 1 and 4 players'
    }
  },
  currentTurn: { 
    type: String,
    required: function(this: IGame) {
      return this.status === 'active' || this.status === 'finished';
    },
  },
  turnNumber: { 
    type: Number, 
    default: 1,
    min: 1,
  },
  startTime: { 
    type: Date,
    required: function(this: IGame) {
      return this.status === 'active' || this.status === 'finished';
    },
  },
  endTime: {
    type: Date,
    default: null,
  },
  boardState: {
    type: [PropertySchema],
    required: true,
    validate: {
      validator: function(arr: IProperty[]) {
        return arr.length === 40; // Standard Monopoly board
      },
      message: 'Board must have exactly 40 spaces'
    }
  },
  activeDuel: {
    type: DuelSchema,
    default: null,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
GameSchema.index({ roomCode: 1 });
GameSchema.index({ status: 1, createdAt: -1 });
GameSchema.index({ 'players.socketId': 1 });

// TTL index - automatically delete finished games after 24 hours
GameSchema.index(
  { updatedAt: 1 }, 
  { 
    expireAfterSeconds: 86400, // 24 hours
    partialFilterExpression: { status: 'finished' }
  }
);

// Virtuals
GameSchema.virtual('isActive').get(function(this: IGame) {
  return this.status === 'active';
});

GameSchema.virtual('isWaiting').get(function(this: IGame) {
  return this.status === 'waiting';
});

GameSchema.virtual('isFinished').get(function(this: IGame) {
  return this.status === 'finished';
});

GameSchema.virtual('playerCount').get(function(this: IGame) {
  return this.players.length;
});

GameSchema.virtual('isFull').get(function(this: IGame) {
  return this.players.length >= 4;
});

// Instance methods
GameSchema.methods.getPlayerById = function(playerId: string): IPlayer | undefined {
  return this.players.find((p: IPlayer) => p.id === playerId);
};

GameSchema.methods.getPropertyByPosition = function(position: number): IProperty | undefined {
  return this.boardState.find((p: IProperty) => p.position === position);
};

GameSchema.methods.getPlayerProperties = function(playerId: string): IProperty[] {
  return this.boardState.filter((p: IProperty) => p.ownerId === playerId);
};

// Pre-save middleware
GameSchema.pre('save', function(next) {
  // Set startTime when game becomes active
  if (this.isModified('status') && this.status === 'active' && !this.startTime) {
    this.startTime = new Date();
  }
  
  // Set endTime when game finishes
  if (this.isModified('status') && this.status === 'finished' && !this.endTime) {
    this.endTime = new Date();
  }
  
  next();
});

// Ensure virtuals are included in JSON
GameSchema.set('toJSON', { virtuals: true });
GameSchema.set('toObject', { virtuals: true });

export const Game = mongoose.model<IGame>('Game', GameSchema);
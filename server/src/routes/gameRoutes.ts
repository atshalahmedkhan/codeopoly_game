// import express from 'express';
// import { Game } from '../models/Game.js';
// import { Problem } from '../models/Problem.js';
// import { generateRoomCode } from '../utils/roomCode.js';
// import { initializeBoard } from '../utils/boardInitializer.js';
// import { saveGame, findGameById, findGameByRoomCode, updateGame } from '../utils/memoryStore.js';
// import mongoose from 'mongoose';

// const router = express.Router();

// // Check if MongoDB is connected (function to check dynamically)
// function useMongoDB() {
//   return mongoose.connection.readyState === 1;
// }

// // Create a new game room
// router.post('/games/create', async (req, res) => {
//   try {
//     const { playerName, avatar } = req.body;
    
//     if (!playerName) {
//       return res.status(400).json({ error: 'Player name is required' });
//     }

//     const roomCode = generateRoomCode();
//     const boardState = initializeBoard();
//     const playerId = `player-${Date.now()}`;

//     const gameData = {
//       roomCode,
//       status: 'waiting',
//       players: [{
//         id: playerId,
//         name: playerName,
//         avatar: avatar || '💻',
//         position: 0,
//         money: 1500,
//         properties: [],
//         inJail: false,
//         jailTurns: 0,
//       }],
//       currentTurn: playerId,
//       turnNumber: 1,
//       startTime: new Date(),
//       boardState,
//     };

//     let game;
//     if (useMongoDB()) {
//       // Use MongoDB if connected
//       game = new Game(gameData);
//       await game.save();
//       res.json({
//         gameId: game._id.toString(),
//         roomCode: game.roomCode,
//         playerId: game.players[0].id,
//       });
//     } else {
//       // Use in-memory store
//       console.log('⚠️  MongoDB not connected, using in-memory store');
//       game = saveGame(gameData);
//       res.json({
//         gameId: game._id,
//         roomCode: game.roomCode,
//         playerId: game.players[0].id,
//       });
//     }
//   } catch (error: any) {
//     console.error('Error creating game:', error);
//     console.error('Error stack:', error.stack);
//     res.status(500).json({ 
//       error: error.message || 'Internal server error',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// });

// // Join an existing game
// router.post('/games/join', async (req, res) => {
//   try {
//     const { roomCode, playerName, avatar } = req.body;

//     if (!roomCode || !playerName) {
//       return res.status(400).json({ error: 'Room code and player name are required' });
//     }

//     let game;
//     const upperRoomCode = roomCode.toUpperCase().trim();
//     if (useMongoDB()) {
//       game = await Game.findOne({ roomCode: upperRoomCode });
//     } else {
//       game = findGameByRoomCode(upperRoomCode);
//     }

//     if (!game) {
//       console.error('Game not found for room code:', upperRoomCode);
//       return res.status(404).json({ error: 'Game not found. Make sure the room code is correct and the game was created.' });
//     }

//     if (game.status !== 'waiting') {
//       return res.status(400).json({ error: 'Game is already in progress' });
//     }

//     if (game.players.length >= 4) {
//       return res.status(400).json({ error: 'Game is full' });
//     }

//     const newPlayer = {
//       id: `player-${Date.now()}`,
//       name: playerName,
//       avatar: avatar || '💻',
//       position: 0,
//       money: 1500,
//       properties: [],
//       inJail: false,
//       jailTurns: 0,
//     };

//     game.players.push(newPlayer);
    
//     if (useMongoDB()) {
//       await game.save();
//     } else {
//       updateGame(game._id.toString ? game._id.toString() : game._id, game);
//     }

//     res.json({
//       gameId: game._id.toString ? game._id.toString() : game._id,
//       roomCode: game.roomCode,
//       playerId: newPlayer.id,
//     });
//   } catch (error: any) {
//     console.error('Error joining game:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get game state
// router.get('/games/:gameId', async (req, res) => {
//   try {
//     let game;
//     if (useMongoDB()) {
//       game = await Game.findById(req.params.gameId);
//     } else {
//       game = findGameById(req.params.gameId);
//     }

//     if (!game) {
//       return res.status(404).json({ error: 'Game not found' });
//     }

//     res.json(game);
//   } catch (error: any) {
//     console.error('Error fetching game:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// // Get problems by category and difficulty
// router.get('/problems', async (req, res) => {
//   try {
//     const { category, difficulty } = req.query;

//     const query: any = {};
//     if (category) query.category = category;
//     if (difficulty) query.difficulty = difficulty;

//     const problems = await Problem.find(query).limit(20);

//     res.json(problems);
//   } catch (error: any) {
//     console.error('Error fetching problems:', error);
//     res.status(500).json({ error: error.message });
//   }
// });

// export default router;




import express from 'express';
import { Game } from '../models/Game.js';
import { Problem } from '../models/Problem.js';
import { generateRoomCode } from '../utils/roomCode.js';
import { initializeBoard } from '../utils/boardInitializer.js';
import { saveGame, findGameById, findGameByRoomCode, updateGame } from '../utils/memoryStore.js';
import mongoose from 'mongoose';

const router = express.Router();

// Check if MongoDB is connected
function useMongoDB() {
  return mongoose.connection.readyState === 1;
}

// Helper to normalize game ID
function normalizeId(id) {
  if (typeof id === 'string') return id;
  if (id && id.toString) return id.toString();
  return String(id);
}

// Create a new game room
router.post('/games/create', async (req, res) => {
  try {
    const { playerName, avatar } = req.body;
    
    // Validate input
    if (!playerName || typeof playerName !== 'string') {
      return res.status(400).json({ error: 'Valid player name is required' });
    }

    if (playerName.length > 50) {
      return res.status(400).json({ error: 'Player name too long (max 50 characters)' });
    }

    const roomCode = generateRoomCode();
    const boardState = initializeBoard();
    const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const gameData = {
      roomCode,
      status: 'waiting',
      players: [{
        id: playerId,
        name: playerName.trim(),
        avatar: (avatar || '💻').substring(0, 10), // Limit avatar length
        position: 0,
        money: 1500,
        properties: [],
        inJail: false,
        jailTurns: 0,
      }],
      currentTurn: playerId,
      turnNumber: 1,
      startTime: new Date(),
      boardState,
    };

    let game;
    if (useMongoDB()) {
      // Use MongoDB if connected
      try {
        game = new Game(gameData);
        await game.save();
        res.json({
          gameId: normalizeId(game._id),
          roomCode: game.roomCode,
          playerId: game.players[0].id,
        });
      } catch (dbError) {
        console.error('MongoDB save error:', dbError);
        throw new Error('Failed to save game to database');
      }
    } else {
      // Use in-memory store
      console.log('⚠️  MongoDB not connected, using in-memory store');
      game = saveGame(gameData);
      res.json({
        gameId: normalizeId(game._id),
        roomCode: game.roomCode,
        playerId: game.players[0].id,
      });
    }
  } catch (error) {
    console.error('Error creating game:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Join an existing game
router.post('/games/join', async (req, res) => {
  try {
    const { roomCode, playerName, avatar } = req.body;

    // Validate input
    if (!roomCode || typeof roomCode !== 'string') {
      return res.status(400).json({ error: 'Valid room code is required' });
    }

    if (!playerName || typeof playerName !== 'string') {
      return res.status(400).json({ error: 'Valid player name is required' });
    }

    if (playerName.length > 50) {
      return res.status(400).json({ error: 'Player name too long (max 50 characters)' });
    }

    const upperRoomCode = roomCode.toUpperCase().trim();
    
    let game;
    if (useMongoDB()) {
      try {
        game = await Game.findOne({ roomCode: upperRoomCode });
      } catch (dbError) {
        console.error('MongoDB find error:', dbError);
        return res.status(500).json({ error: 'Database error occurred' });
      }
    } else {
      game = findGameByRoomCode(upperRoomCode);
    }

    if (!game) {
      console.error('Game not found for room code:', upperRoomCode);
      return res.status(404).json({ 
        error: 'Game not found. Make sure the room code is correct.' 
      });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is already in progress' });
    }

    if (game.players.length >= 4) {
      return res.status(400).json({ error: 'Game is full (maximum 4 players)' });
    }

    // Check for duplicate player names
    const trimmedPlayerName = playerName.trim();
    const duplicateName = game.players.some(
      p => p.name.toLowerCase() === trimmedPlayerName.toLowerCase()
    );
    if (duplicateName) {
      return res.status(400).json({ 
        error: 'A player with this name already exists in the game' 
      });
    }

    const newPlayer = {
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: trimmedPlayerName,
      avatar: (avatar || '💻').substring(0, 10),
      position: 0,
      money: 1500,
      properties: [],
      inJail: false,
      jailTurns: 0,
    };

    game.players.push(newPlayer);
    
    try {
      if (useMongoDB()) {
        await game.save();
      } else {
        updateGame(normalizeId(game._id), game);
      }
    } catch (saveError) {
      console.error('Error saving game after join:', saveError);
      return res.status(500).json({ error: 'Failed to update game' });
    }

    res.json({
      gameId: normalizeId(game._id),
      roomCode: game.roomCode,
      playerId: newPlayer.id,
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get game state
router.get('/games/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;

    if (!gameId) {
      return res.status(400).json({ error: 'Game ID is required' });
    }

    let game;
    if (useMongoDB()) {
      try {
        // Validate MongoDB ObjectId format
        if (!mongoose.Types.ObjectId.isValid(gameId)) {
          return res.status(400).json({ error: 'Invalid game ID format' });
        }
        game = await Game.findById(gameId);
      } catch (dbError) {
        console.error('MongoDB findById error:', dbError);
        return res.status(500).json({ error: 'Database error occurred' });
      }
    } else {
      game = findGameById(gameId);
    }

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get problems by category and difficulty
router.get('/problems', async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    // Check if MongoDB is available for problems
    if (!useMongoDB()) {
      console.warn('MongoDB not connected - cannot fetch problems');
      return res.status(503).json({ 
        error: 'Problem database unavailable',
        message: 'Please ensure MongoDB is connected'
      });
    }

    const query = {};
    if (category && typeof category === 'string') {
      query.category = category.trim();
    }
    if (difficulty && typeof difficulty === 'string') {
      const validDifficulties = ['easy', 'medium', 'hard'];
      const normalizedDifficulty = difficulty.toLowerCase().trim();
      if (validDifficulties.includes(normalizedDifficulty)) {
        query.difficulty = normalizedDifficulty;
      }
    }

    try {
      const problems = await Problem.find(query).limit(20).lean();
      res.json(problems || []);
    } catch (dbError) {
      console.error('Error querying problems:', dbError);
      res.status(500).json({ error: 'Failed to fetch problems from database' });
    }
  } catch (error) {
    console.error('Error fetching problems:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Start game (optional endpoint to change status from waiting to active)
router.post('/games/:gameId/start', async (req, res) => {
  try {
    const { gameId } = req.params;

    let game;
    if (useMongoDB()) {
      if (!mongoose.Types.ObjectId.isValid(gameId)) {
        return res.status(400).json({ error: 'Invalid game ID format' });
      }
      game = await Game.findById(gameId);
    } else {
      game = findGameById(gameId);
    }

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game has already started' });
    }

    if (game.players.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 players to start' });
    }

    game.status = 'active';

    if (useMongoDB()) {
      await game.save();
    } else {
      updateGame(gameId, game);
    }

    res.json({ success: true, game });
  } catch (error) {
    console.error('Error starting game:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
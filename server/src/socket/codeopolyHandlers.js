/**
 * CodeOpoly Socket Handlers
 * Integrates the new CodeOpoly game engine with Socket.IO
 */

import gameManager from '../codeopoly/gameManager.js';

export function setupCodeopolyHandlers(io, socket) {
  console.log('✅ CodeOpoly handlers registered for socket:', socket.id);
  
  // Create a new CodeOpoly game
  socket.on('codeopoly:create', async ({ gameId, players }) => {
    console.log('🎮 CODEOPOLY:CREATE received!', { gameId, players });
    try {
      if (!players || players.length === 0) {
        throw new Error('No players provided');
      }
      
      const playerNames = players.map(p => p.name);
      console.log('Creating game with players:', playerNames);
      
      const game = gameManager.createGame(gameId, playerNames);
      console.log('Game created successfully:', gameId);
      
      // Map player IDs
      players.forEach((p, index) => {
        if (game.players[index]) {
          game.players[index].socketId = p.socketId;
          game.players[index].originalId = p.id;
        }
      });
      
      socket.join(gameId);
      const gameState = gameManager.getGameState(gameId);
      console.log('Emitting codeopoly:created with state:', gameState);
      
      io.to(gameId).emit('codeopoly:created', {
        gameState: gameState
      });
      
      console.log('✅ CodeOpoly game created and state sent!');
    } catch (error) {
      console.error('❌ Error creating CodeOpoly game:', error);
      console.error('Stack:', error.stack);
      socket.emit('error', { message: error.message });
    }
  });

  // Roll dice
  socket.on('codeopoly:rollDice', async ({ gameId, playerId }) => {
    try {
      const result = await gameManager.rollDice(gameId, playerId);
      
      io.to(gameId).emit('codeopoly:diceRolled', {
        playerId,
        ...result
      });
      
      // Send tile action options based on tile type
      const { tile } = result;
      io.to(gameId).emit('codeopoly:tileAction', {
        playerId,
        tile,
        options: getTileActionOptions(tile, gameManager.getGame(gameId), playerId)
      });
    } catch (error) {
      console.error('Error rolling dice:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Handle tile actions (buy, challenge, skip, etc.)
  socket.on('codeopoly:tileAction', async ({ gameId, playerId, action, data }) => {
    try {
      const result = await gameManager.handleTileAction(gameId, playerId, action, data);
      
      io.to(gameId).emit('codeopoly:actionResult', result);
      
      // If action is complete, move to next turn
      if (result.success && !['challengeStarted', 'codeDuelStarted'].includes(result.type)) {
        const turnResult = gameManager.nextTurn(gameId);
        io.to(gameId).emit('codeopoly:turnUpdate', turnResult);
        
        if (turnResult.type === 'gameEnded') {
          io.to(gameId).emit('codeopoly:gameOver', turnResult);
        }
      }
    } catch (error) {
      console.error('Error handling tile action:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Submit challenge solution
  socket.on('codeopoly:submitChallenge', async ({ gameId, playerId, propertyId, code, language }) => {
    try {
      const result = await gameManager.submitChallengeSolution(gameId, playerId, propertyId, code, language);
      
      io.to(gameId).emit('codeopoly:challengeResult', result);
      
      // Move to next turn after challenge
      if (result.success) {
        const turnResult = gameManager.nextTurn(gameId);
        io.to(gameId).emit('codeopoly:turnUpdate', turnResult);
        
        if (turnResult.type === 'gameEnded') {
          io.to(gameId).emit('codeopoly:gameOver', turnResult);
        }
      }
    } catch (error) {
      console.error('Error submitting challenge:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Code duel result
  socket.on('codeopoly:duelResult', async ({ gameId, winnerId, loserId }) => {
    try {
      const result = await gameManager.resolveCodeDuel(gameId, winnerId, loserId);
      
      io.to(gameId).emit('codeopoly:duelResolved', result);
      
      // Move to next turn
      const turnResult = gameManager.nextTurn(gameId);
      io.to(gameId).emit('codeopoly:turnUpdate', turnResult);
      
      if (turnResult.type === 'gameEnded') {
        io.to(gameId).emit('codeopoly:gameOver', turnResult);
      }
    } catch (error) {
      console.error('Error resolving duel:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Get current game state
  socket.on('codeopoly:getState', ({ gameId }) => {
    try {
      const gameState = gameManager.getGameState(gameId);
      socket.emit('codeopoly:stateUpdate', { gameState });
    } catch (error) {
      console.error('Error getting game state:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // End game early
  socket.on('codeopoly:endGame', ({ gameId }) => {
    try {
      const result = gameManager.endGame(gameId);
      io.to(gameId).emit('codeopoly:gameOver', result);
      gameManager.removeGame(gameId);
    } catch (error) {
      console.error('Error ending game:', error);
      socket.emit('error', { message: error.message });
    }
  });

  // Player disconnect
  socket.on('disconnect', () => {
    // Handle player disconnection
    // Mark player as inactive in their game
    console.log('Player disconnected:', socket.id);
  });
}

function getTileActionOptions(tile, game, playerId) {
  const player = game.players.find(p => p.id === playerId);
  
  switch (tile.type) {
    case 'PROPERTY':
      if (tile.owner === null) {
        return [
          { action: 'buy', label: `Buy for $${tile.price}`, enabled: player.cash >= tile.price },
          { action: 'challenge', label: 'Solve Challenge', enabled: true },
          { action: 'skip', label: 'Skip', enabled: true }
        ];
      } else if (tile.owner !== playerId) {
        const rent = Math.floor(tile.price * 0.2);
        return [
          { action: 'payRent', label: `Pay Rent $${rent}`, enabled: true }
        ];
      } else {
        return [
          { action: 'continue', label: 'Your Property', enabled: true }
        ];
      }
      
    case 'CODE_DUEL':
      return [
        { action: 'startDuel', label: 'Start Code Duel', enabled: true }
      ];
      
    case 'SYSTEM_CRASH':
    case 'CODE_REVIEW':
    case 'HACKATHON':
      return [
        { action: 'continue', label: 'Continue', enabled: true }
      ];
      
    default:
      return [
        { action: 'continue', label: 'Continue', enabled: true }
      ];
  }
}

export { setupCodeopolyHandlers };
export default setupCodeopolyHandlers;

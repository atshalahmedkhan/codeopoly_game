# CodeOpoly Integration Guide

## Overview

I've successfully created the complete backend game logic for CodeOpoly and integrated it with your existing frontend. The integration includes:

1. **Complete Game Engine** (`server/src/codeopoly/`)
   - Full game mechanics with 5 rounds
   - Property buying/selling with coding challenges
   - Special events (Code Duels, Hackathons, System Crashes, etc.)
   - Dynamic scoring and end-game logic

2. **Socket.IO Integration** (`server/src/socket/codeopolyHandlers.js`)
   - Real-time multiplayer support
   - Event-driven architecture
   - Seamless frontend-backend communication

## Backend Structure

```
server/src/codeopoly/
├── gameEngine.js       # Core game logic and state management
├── tiles.js           # Board definition with all tile types
├── players.js         # Player creation and management
├── challenges.js      # LeetCode challenge simulation
├── gameManager.js     # Socket.IO integration layer
├── simulation.js      # Standalone game runner
├── test-game.js       # Test script
└── index.js          # Module exports
```

## Key Features Implemented

### 1. Game Flow
- 5 rounds or 60 minutes (whichever comes first)
- Players start with $1500
- Pass GO to collect $200
- Bankruptcy when cash < 0

### 2. Tile Types
- **Properties**: Buy, solve challenges, or skip
- **Code Duel**: 1v1 coding competition (+$1000/-$300)
- **System Crash**: Skip next turn
- **Code Review**: Random events (+/- money)
- **Hackathon**: Team competition

### 3. Coding Challenges
- Easy: 70% success rate, +$200
- Medium: 50% success rate, +$400
- Hard: 30% success rate, +$700
- Failure: -$100 penalty

### 4. End Game
- Winner: Highest net worth
- Awards: Best Coder, Tech Mogul, Top Investor

## Socket Events

### Client → Server
- `codeopoly:create` - Create new game
- `codeopoly:rollDice` - Roll dice
- `codeopoly:tileAction` - Handle tile actions (buy/challenge/skip)
- `codeopoly:submitChallenge` - Submit code solution
- `codeopoly:duelResult` - Report duel outcome
- `codeopoly:getState` - Request game state
- `codeopoly:endGame` - End game early

### Server → Client
- `codeopoly:created` - Game created
- `codeopoly:diceRolled` - Dice result and movement
- `codeopoly:tileAction` - Available actions for tile
- `codeopoly:actionResult` - Result of tile action
- `codeopoly:challengeResult` - Challenge outcome
- `codeopoly:turnUpdate` - Turn changed
- `codeopoly:gameOver` - Game ended with final scores

## Frontend Integration Steps

To use the new CodeOpoly backend in your frontend:

### 1. Update GameRoom.tsx to use new events:

```javascript
// Initialize CodeOpoly game
socket.emit('codeopoly:create', {
  gameId,
  players: gameState.players.map(p => ({
    id: p.id,
    name: p.name,
    socketId: p.socketId
  }))
});

// Roll dice
socket.emit('codeopoly:rollDice', { gameId, playerId });

// Handle property actions
socket.emit('codeopoly:tileAction', {
  gameId,
  playerId,
  action: 'buy', // or 'challenge' or 'skip'
  data: {}
});
```

### 2. Listen for new events:

```javascript
socket.on('codeopoly:diceRolled', (data) => {
  // Update UI with dice animation
  // Move player token
  // Show available actions
});

socket.on('codeopoly:actionResult', (result) => {
  // Update game state
  // Show notifications
  // Update player stats
});

socket.on('codeopoly:gameOver', (data) => {
  // Show final scores
  // Display awards
  // Show winner celebration
});
```

## Testing

You can test the backend independently:

```bash
cd server/src/codeopoly
node simulation.js
```

This runs a complete game simulation with console output.

## Next Steps

1. **Frontend Migration**: Update the React components to use the new socket events
2. **Challenge Integration**: Connect the Monaco editor to submit real code
3. **UI Polish**: Add animations for special events (hackathons, duels, etc.)
4. **Persistence**: Save game state to MongoDB between rounds
5. **Spectator Mode**: Allow watching ongoing games

## Benefits of New System

- **Modular Architecture**: Clean separation of concerns
- **Event-Driven**: Perfect for real-time updates
- **Extensible**: Easy to add new tile types or mechanics
- **Testable**: Can run simulations without UI
- **Educational**: Combines strategy with coding practice

The backend is fully functional and ready for frontend integration!

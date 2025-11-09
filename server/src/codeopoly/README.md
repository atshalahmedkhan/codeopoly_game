# CodeOpoly - Backend Game Logic

A Monopoly-inspired coding game that combines property trading with LeetCode-style challenges.

## 🎮 Game Overview

- **Players**: 2-4 players
- **Duration**: 5 rounds or 60 minutes (whichever comes first)
- **Starting Cash**: $1500 per player
- **Objective**: Highest net worth (cash + properties + challenge bonuses) wins

## 🚀 How to Run

```bash
# Navigate to the codeopoly directory
cd server/src/codeopoly

# Run with default players (Alice, Bob, Charlie, David)
node simulation.js

# Run with custom players
node simulation.js Player1 Player2 Player3 Player4
```

## 📁 File Structure

- `gameEngine.js` - Core game logic and state management
- `tiles.js` - Board definition and tile types
- `players.js` - Player creation and management
- `challenges.js` - LeetCode challenge simulation
- `simulation.js` - Game runner with console output
- `index.js` - Main entry point and module exports

## 🎯 Game Mechanics

### Tile Types

1. **Property Tiles**
   - Buy for listed price
   - Solve coding challenge for free ownership + cash reward
   - Pay 20% rent to owner when landing on owned property

2. **Code Duel**
   - Challenge random opponent
   - Winner: +$1000, Loser: -$300

3. **System Crash**
   - Miss next turn while debugging

4. **Code Review**
   - Random positive/negative event
   - Gain or lose $100-$400

5. **Hackathon**
   - Team-based competition
   - Winning team: +$500 each, Losing team: -$200 each

### Coding Challenges

- **Easy**: 70% success, +$200 reward
- **Medium**: 50% success, +$400 reward  
- **Hard**: 30% success, +$700 reward
- **Failure**: -$100 penalty

### Special Features

- Pass START: Collect $200
- Bankruptcy: Cash < 0 eliminates player
- Net Worth: Cash + Property Values + (Challenges × $50)

### End Game Awards

- 🏆 **Winner**: Highest net worth
- 🧠 **Best Coder**: Most challenges solved
- 🏢 **Tech Mogul**: Most properties owned
- 💰 **Top Investor**: Highest cash balance

## 🔧 Integration

The game is designed for easy UI integration:

```javascript
const { GameEngine } = require('./codeopoly');

// Create game instance
const game = new GameEngine(['Player1', 'Player2']);

// Game emits events for UI updates
game.on('turnStart', (player) => { /* Update UI */ });
game.on('diceRoll', (value) => { /* Show dice animation */ });
game.on('propertyPurchase', (player, property) => { /* Update board */ });

// Start game
await game.startGame();
```

## 📊 Sample Output

```
🎮 CodeOpoly Game Initialized!
Players: Alice, Bob, Charlie, David
Starting cash: $1500
==================================================

ROUND 1 BEGINS!
==================================================

🎯 Alice's turn (Cash: $1500)
🎲 Alice rolled a 4
Alice moved 4 spaces to JavaScript Junction (Position 4)
🏢 JavaScript Junction is available!
   Price: $140 | Difficulty: medium
🧠 Alice attempts to solve the coding challenge!
✅ Alice solved the challenge successfully!
🏢 Alice now owns JavaScript Junction!
💵 Alice gained $400 (Balance: $1900)

[... more turns ...]

🏁 GAME OVER!
==================================================

🏆 WINNER: Alice with a net worth of $4350!

📊 Final Standings:
1. Alice: $4350
2. Charlie: $3200  
3. Bob: $2800
4. David: $1500

🏅 Special Awards:
🧠 Best Coder: Alice (3 challenges solved)
🏢 Tech Mogul: Charlie (4 properties)
💰 Top Investor: Bob ($2100 in cash)
```

## 🎨 Future Enhancements

- Connect to React/Flutter UI
- Add multiplayer networking
- Implement real coding challenges
- Add property upgrades (houses/hotels)
- Create custom board layouts
- Add AI opponents with strategies

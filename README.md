# CodeOpoly 🎮

A Monopoly-inspired coding game that combines property trading with LeetCode-style challenges. Built with React, TypeScript, Node.js, and Socket.IO.

## 📚 Documentation

- **[Unified Game Rules](./UNIFIED_GAME_RULES.md)** - Comprehensive game mechanics documentation
- **[Changelog](./CHANGELOG.md)** - Recent updates and consolidation changes
- **[Quick Start Guide](./QUICK_START.md)** - Get up and running quickly
- **[Implementation Status](./IMPLEMENTATION_COMPLETE.md)** - Feature completion status

## 🎯 Features

- **Real-time Multiplayer**: Play with 2-4 players using Socket.IO
- **Coding Challenges**: Solve LeetCode problems to earn properties
- **Property Trading**: Buy, sell, and collect rent on coding-themed properties
- **Special Events**: Code Duels, Hackathons, System Crashes, and Code Reviews
- **Modern UI**: Beautiful dark theme with glassmorphism effects and animations
- **5 Round Gameplay**: Strategic gameplay with automatic scoring

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MongoDB (optional - uses in-memory storage if not available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd UB_Hacking
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   
   Create `.env` files if needed:
   - `server/.env` - MongoDB URI (optional)
   - `client/.env` - API URL (defaults to localhost:3001)

4. **Start the servers**
   
   ```bash
   # Terminal 1 - Start backend server
   cd server
   npm run dev
   
   # Terminal 2 - Start frontend client
   cd client
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🎮 How to Play

1. **Create or Join a Room**
   - Click "Create Room" to start a new game
   - Or enter a 4-letter room code to join an existing game

2. **Wait for Players**
   - Need at least 2 players to start
   - Share your room code with friends

3. **Play the Game**
   - Roll dice to move around the board
   - Land on properties to:
     - **Buy** with cash 💰
     - **Solve** coding challenges 🧠 (earn property + bonus reward)
     - **Skip** to save money
   - Special tiles trigger events:
     - **Code Duel**: Challenge another player (+$1000/-$300)
     - **Hackathon**: Team competition
     - **System Crash**: Skip next turn
     - **Code Review**: Random bonus/penalty

4. **Win Conditions**
   - Game ends after 5 rounds
   - Winner = highest net worth (cash + properties + challenges)
   - Special awards: Best Coder, Tech Mogul, Top Investor

## 🎲 Game Mechanics

### Rent Calculation
Rent scales with property improvements using **linear interpolation**:
- **No houses**: Base rent (e.g., $10)
- **1-3 houses**: Interpolated between base and house rent
- **4+ houses (hotel)**: Maximum rent (e.g., $200)

Example: Base $10, House $50, Hotel $200
- 0 houses → $10
- 1 house → $20
- 2 houses → $30
- 3 houses → $40
- 4+ houses → $200

### Challenge Rewards
Solve coding challenges to earn properties AND cash bonuses:
- **Easy**: $200 bonus
- **Medium**: $400 bonus
- **Hard**: $700 bonus

### Bankruptcy
When you can't pay rent:
- **With creditor**: All properties transfer to the creditor
- **Without creditor**: Properties return to the bank (houses removed)
- Player eliminated from game

### Passing GO
- Collect **$200** every time you pass or land on GO

See **[UNIFIED_GAME_RULES.md](./UNIFIED_GAME_RULES.md)** for complete mechanics documentation.

## 🏗️ Architecture

### Frontend (`client/`)
- **React + TypeScript**: Modern UI framework
- **Socket.IO Client**: Real-time communication
- **Framer Motion**: Smooth animations
- **Tailwind CSS**: Styling
- **Monaco Editor**: Code challenge interface

### Backend (`server/`)
- **Node.js + Express**: REST API
- **Socket.IO**: WebSocket server
- **MongoDB**: Game state persistence (optional)
- **CodeOpoly Engine**: Complete game logic

### Key Components

- `GameRoom.tsx` - Main game interface
- `EnhancedMonopolyBoard.tsx` - 3D game board
- `CodeDuelModal.tsx` - Coding challenge interface
- `gameEngine.js` - Core game logic
- `gameManager.js` - Socket.IO integration

## 📁 Project Structure

```
UB_Hacking/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/         # Page components
│   │   ├── styles/        # CSS files
│   │   └── ...
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── codeopoly/     # Game engine
│   │   ├── socket/        # Socket handlers
│   │   ├── routes/        # API routes
│   │   └── ...
│   └── package.json
└── README.md
```

## 🎨 Features in Detail

### Property System
- Properties have prices ($100-$500)
- Pay 20% rent when landing on owned properties
- Solve challenges for free ownership + cash bonus

### Challenge System
- **Easy**: 70% success rate, +$200 reward
- **Medium**: 50% success rate, +$400 reward
- **Hard**: 30% success rate, +$700 reward
- Failure: -$100 penalty

### Special Events
- **Code Duel**: 1v1 coding competition
- **Hackathon**: Team-based challenges
- **System Crash**: Skip next turn penalty
- **Code Review**: Random positive/negative events

## 🛠️ Development

### Running Tests
```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

### Building for Production
```bash
# Build client
cd client
npm run build

# Build server
cd server
npm run build
```

## 📝 Environment Variables

### Server
- `MONGODB_URI` - MongoDB connection string (optional)
- `PORT` - Server port (default: 3001)
- `CLIENT_URL` - Allowed CORS origins

### Client
- `VITE_SERVER_URL` - Backend API URL (default: http://localhost:3001)
- `VITE_FIREBASE_API_KEY` - Firebase API key (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Monopoly
- LeetCode for coding challenges
- React and Socket.IO communities

## 🐛 Known Issues

- Firebase authentication is optional (works without it)
- Room codes are 4 uppercase letters
- Game requires 2+ players to start

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for coding enthusiasts**

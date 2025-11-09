# Changelog

## [Unreleased] - Game Logic Consolidation

### Added
- **Unified Game Logic Library** (`lib/gameLogic.ts`)
  - Single source of truth for core game mechanics
  - Consolidated rent calculation using linear interpolation for houses
  - Unified bankruptcy resolution with creditor property transfer
  - Standardized turn advancement with skip flag handling
  - Challenge reward mapping based on difficulty
  
- **Type Definitions** (`lib/types/gameLogic.ts`)
  - Unified Player, Property, GameState interfaces
  - BankruptcyResult, TurnResult, PropertyActionResult types
  - Shared across server and client for type safety

- **Game Constants** (`lib/constants.ts`)
  - PASS_GO_REWARD: 200
  - DIFFICULTY_REWARDS: { easy: 200, medium: 400, hard: 700 }
  - MAX_HOUSES: 4
  - BANKRUPTCY_TRANSFER_TO_CREDITOR: true

- **Server Adapter** (`server/src/codeopoly/gameLogicAdapter.js`)
  - Bridge between server's cash/active fields and unified money/isActive fields
  - Server-side wrappers for unified logic functions
  
- **Comprehensive Test Suite** (`lib/__tests__/gameLogic.test.ts`)
  - 40+ test cases covering all unified functions
  - Jest configuration with 80% coverage threshold
  - Tests for rent calculation, bankruptcy, turn order, property actions

### Changed
- **Rent Calculation** - Now consistent across all components
  - **Before (Server)**: `Math.floor(property.price * 0.2)` - Fixed 20% of price
  - **Before (Socket)**: Complex difficulty multiplier based on price ranges
  - **Before (Client)**: Array-based lookup `property.rent[houses]`
  - **After (All)**: Linear interpolation `baseRent + (houseRent - baseRent) * (houses / 4)` for houses 1-3
  - Proper hotel rent at 4+ houses
  - Special handling for railroads and utilities

- **Challenge Rewards** - Centralized constants
  - **Before**: Hard-coded ternary operators in multiple files
  - **After**: Single `DIFFICULTY_REWARDS` constant imported everywhere
  - Easy: 200, Medium: 400, Hard: 700

- **Bankruptcy Handling** - Unified property transfer
  - **Before (Server)**: Set `active=false` and `cash=0`, properties orphaned
  - **Before (Client)**: Transfer properties to creditor or reset
  - **After (All)**: Consistent transfer to creditor if exists, else reset to bank with houses removed

- **Client Code Quality**
  - Removed 576 lines of commented-out legacy code from `client/src/engine/GameEngine.ts`
  - Improved calculateRent to support both array-based and property-based schemas

### Fixed
- **Rent Divergence**: All components now calculate identical rent amounts
- **Challenge Reward Inconsistency**: Server, client, and socket handlers use same reward values
- **Bankruptcy Property Leaks**: Properties no longer remain orphaned when player goes bankrupt
- **Turn Order Edge Cases**: Properly handles skipNextTurn flags and bankrupt player filtering

### Technical Debt Reduced
- Eliminated duplicate rent calculation implementations (3 different formulas → 1 unified)
- Removed duplicate challenge reward mapping (5 locations → 1 constant)
- Consolidated bankruptcy logic (3 implementations → 1 unified)
- Cleaned up 576 lines of dead code

### Backward Compatibility
- Server maintains `cash` and `active` fields via adapter for existing game saves
- Client supports both legacy array-based rent and new unified property schema
- No breaking changes to socket event formats

### Testing
- Added Jest test framework to lib/
- 40+ unit tests with comprehensive coverage:
  - Rent calculation: 8 tests (base, houses 1-3, hotel, railroads, utilities)
  - Challenge rewards: 4 tests (easy, medium, hard, unknown fallback)
  - Bankruptcy: 3 tests (with creditor, without creditor, no properties)
  - Turn advancement: 6 tests (normal, skip bankrupt, skip flags, round tracking)
  - Property upgrades: 4 tests (ownership, money, hotel limit)
  - Net worth: 2 tests (with/without properties)
  - Property landing: 5 tests (buy, skip, own, rent, bankruptcy)
  - Move player: 3 tests (normal move, pass GO, land on GO)

### Documentation
- This CHANGELOG documenting all changes
- Inline code documentation for all unified functions
- Test suite serves as specification for game rules

## Migration Notes for Developers

### Using Unified Logic in Server
```javascript
import { calculateRentServer, getChallengeRewardServer, resolveBankruptcyServer } from './gameLogicAdapter.js';

// Calculate rent
const rent = calculateRentServer(property);

// Get challenge reward
const reward = getChallengeRewardServer(property.difficulty);

// Handle bankruptcy
const result = resolveBankruptcyServer(player, creditor, allProperties);
```

### Using Unified Logic in Client
```typescript
import { calculateRent, performPropertyLanding, resolveBankruptcy } from '@/lib/gameLogic';

// Calculate rent (supports both schemas)
const rent = calculateRent(property);

// Check property landing actions
const result = performPropertyLanding(player, property, owner);
```

### Running Tests
```bash
cd lib
npm install
npm test
npm run test:coverage  # View coverage report
```

## Known Limitations
- Server still uses `cash` field internally (aliased to `money` via adapter)
- Client property schema uses array-based rent (calculateRent supports both)
- No migration script for existing saved games (backward compatible for one release)

## Future Work
- Migrate server completely to TypeScript
- Standardize property schema across client and server
- Add integration tests for multiplayer scenarios
- Add performance benchmarks for rent calculation

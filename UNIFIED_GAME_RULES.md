# Unified Game Rules - Codeopoly

This document describes the canonical game mechanics after the consolidation effort. All server, client, and shared logic components now implement these unified rules consistently.

## Table of Contents
1. [Currency and Starting Money](#currency-and-starting-money)
2. [Rent Calculation](#rent-calculation)
3. [Property Purchase and Ownership](#property-purchase-and-ownership)
4. [Challenge System](#challenge-system)
5. [Bankruptcy Resolution](#bankruptcy-resolution)
6. [Turn Order](#turn-order)
7. [Property Upgrades](#property-upgrades)
8. [Passing GO](#passing-go)
9. [Net Worth Calculation](#net-worth-calculation)

---

## Currency and Starting Money

**Field Name**: `money` (unified across components)
- **Starting Amount**: $1,500
- **Server Note**: Internally uses `cash` field, aliased via adapter to `money`

---

## Rent Calculation

### Formula
Rent is calculated based on the number of houses/hotels on a property:

```typescript
if (houses === 0) {
  rent = property.rent  // Base rent
} else if (houses >= 4) {
  rent = property.rentWithHotel  // Hotel rent
} else {
  // Linear interpolation for houses 1-3
  rent = property.rent + (property.rentWithHouse - property.rent) * (houses / 4)
}
```

### Examples
For a property with:
- Base rent: $10
- Rent with house: $50
- Rent with hotel: $200

| Houses | Calculation | Rent |
|--------|-------------|------|
| 0 | Base rent | $10 |
| 1 | $10 + ($50 - $10) × (1/4) = $10 + $10 | $20 |
| 2 | $10 + ($50 - $10) × (2/4) = $10 + $20 | $30 |
| 3 | $10 + ($50 - $10) × (3/4) = $10 + $30 | $40 |
| 4+ | Hotel rent | $200 |

### Special Properties
- **Railroads**: Fixed rent (no houses)
- **Utilities**: Fixed rent (no houses)

### What Changed
- ❌ **Old Server**: `Math.floor(property.price * 0.2)` - 20% of purchase price
- ❌ **Old Socket**: Complex multiplier based on price ranges
- ✅ **New**: Consistent linear interpolation using property rent fields

---

## Property Purchase and Ownership

### Landing on Unowned Property
Player has three options:
1. **Buy**: Pay `property.price`, gain ownership
2. **Challenge**: Attempt coding challenge for bonus (see Challenge System)
3. **Skip**: Do nothing

**Important**: Buying a property does NOT automatically add houses. Houses must be purchased separately via upgrades.

### Landing on Owned Property
- **Own Property**: No action required
- **Another Player's Property**: Must pay rent (see Rent Calculation)
- **Cannot Afford Rent**: Bankruptcy (see Bankruptcy Resolution)

---

## Challenge System

### Rewards by Difficulty
Solving a challenge grants both property ownership AND a cash reward:

| Difficulty | Reward |
|------------|--------|
| Easy | $200 |
| Medium | $400 |
| Hard | $700 |

### Challenge Flow
1. Player lands on unowned property
2. Player selects "Challenge" option
3. System presents coding problem matching property difficulty
4. **Success**: 
   - Player gains property ownership
   - Player receives difficulty reward
   - Player's `solvedChallenges` counter increments
5. **Failure**: 
   - Player loses $100 penalty
   - Property remains unowned

### Constants
Defined in `lib/constants.ts`:
```typescript
export const DIFFICULTY_REWARDS = {
  easy: 200,
  medium: 400,
  hard: 700,
}
```

---

## Bankruptcy Resolution

### When Bankruptcy Occurs
A player goes bankrupt when they cannot pay required rent or fees.

### Resolution Process

#### With Creditor (Owed Money to Another Player)
1. Bankrupt player's `money` set to 0
2. Bankrupt player's `isActive` set to false
3. **All properties transferred to creditor**:
   - Property `ownerId` changed to creditor's ID
   - Properties added to creditor's property list
4. Bankrupt player's property list cleared

#### Without Creditor (Owed to Bank)
1. Bankrupt player's `money` set to 0
2. Bankrupt player's `isActive` set to false
3. **All properties reset to bank**:
   - Property `ownerId` set to undefined
   - Property `houses` reset to 0
4. Bankrupt player's property list cleared

### Implementation
```typescript
export const BANKRUPTCY_TRANSFER_TO_CREDITOR = true;
```

### What Changed
- ❌ **Old Server**: Properties remained with bankrupt player (orphaned)
- ✅ **New**: Properties properly transferred or reset

---

## Turn Order

### Basic Progression
Turns advance sequentially through active players.

### Skip Conditions
A player's turn is skipped if:
1. **Bankrupt**: Player with `isActive === false`
2. **Skip Flag**: Player with `skipNextTurn === true`
   - Flag is automatically cleared after skip
   - Example: System Crash event sets this flag

### Round Tracking
A round completes when all players have taken their turn. The `roundIncremented` flag indicates when a new round starts.

### Algorithm
```typescript
1. Start with current player index
2. Advance to next index (wrap around if needed)
3. Check if player is active (not bankrupt)
   - If inactive, skip and continue to next
4. Check if player has skipNextTurn flag
   - If true, clear flag, add to skipped list, continue to next
5. Return next valid player
```

### Edge Cases
- **All Players Bankrupt**: Throws error (game should have ended)
- **Only Skip Flags**: Clears all flags and continues
- **Last Player Bankrupt**: Wraps to first active player

---

## Property Upgrades

### Requirements
To upgrade a property (add houses):
1. Player must own the property (`property.ownerId === player.id`)
2. Player must have sufficient money (`player.money >= property.houseCost`)
3. Property must not already have hotel (`property.houses < MAX_HOUSES`)

### Limits
- **Maximum Houses**: 4 (defined as `MAX_HOUSES` constant)
- 4 houses = Hotel (no separate hotel entity)

### Cost
Each house costs `property.houseCost` (varies by property)

### Process
1. Deduct `property.houseCost` from player's money
2. Increment `property.houses` by 1

### What Changed
- ❌ **Old Server**: Some implementations auto-added house on purchase
- ✅ **New**: Houses only added via explicit upgrade action

---

## Passing GO

### Reward
When a player's position wraps around the board (position 0), they receive:
```typescript
export const PASS_GO_REWARD = 200;  // $200
```

### Detection
```typescript
if (player.position + diceRoll >= BOARD_SIZE) {
  player.money += PASS_GO_REWARD;
}
```

### Note
Landing exactly on GO also grants the reward.

---

## Net Worth Calculation

### Formula
```typescript
netWorth = player.money + propertyValues + houseValues
```

Where:
- `propertyValues` = Sum of all owned property purchase prices
- `houseValues` = Sum of (houses × houseCost) for each property

### Example
Player with:
- Money: $1,000
- Property A: Price $200, 2 houses @ $50 each = $200 + $100
- Property B: Price $300, 1 house @ $100 = $300 + $100

**Net Worth**: $1,000 + $200 + $100 + $300 + $100 = **$1,700**

### Usage
- Determining winner when time limit reached
- Displaying player rankings
- Some implementations add challenge bonus: `solvedChallenges × 50`

---

## Implementation Notes

### Server (JavaScript)
Uses adapter functions to bridge unified logic:
```javascript
import { 
  calculateRentServer, 
  getChallengeRewardServer, 
  resolveBankruptcyServer 
} from './gameLogicAdapter.js';
```

### Client (TypeScript)
Imports unified logic directly:
```typescript
import { 
  calculateRent, 
  resolveBankruptcy, 
  advanceTurn 
} from '@/lib/gameLogic';
```

### Shared Library (TypeScript)
Core implementation in `lib/gameLogic.ts` with:
- Type definitions in `lib/types/gameLogic.ts`
- Constants in `lib/constants.ts`
- Full test coverage in `lib/__tests__/gameLogic.test.ts`

---

## Testing

All unified rules have comprehensive test coverage. Run tests with:
```bash
cd lib
npm install
npm test
```

Tests cover:
- Rent calculation (all house counts, special properties)
- Challenge rewards (all difficulties)
- Bankruptcy (with/without creditor)
- Turn advancement (skip conditions)
- Property upgrades (validation)
- Net worth calculation
- Property landing actions

See `lib/__tests__/gameLogic.test.ts` for detailed test specifications.

---

## References

- `lib/gameLogic.ts` - Core implementation
- `lib/constants.ts` - Game constants
- `lib/types/gameLogic.ts` - Type definitions
- `server/src/codeopoly/gameLogicAdapter.js` - Server adapter
- `CHANGELOG.md` - Migration details

/**
 * Tests for unified game logic functions
 */

import {
  calculateRent,
  resolveBankruptcy,
  advanceTurn,
  getChallengeReward,
  performPropertyLanding,
  movePlayer,
  canUpgradeProperty,
  upgradeProperty,
  calculateNetWorth,
} from '../gameLogic';
import { Player, Property } from '../types/gameLogic';
import { PASS_GO_REWARD, DIFFICULTY_REWARDS, MAX_HOUSES } from '../constants';

describe('calculateRent', () => {
  const baseProperty: Property = {
    id: 'test-prop',
    name: 'Test Property',
    position: 1,
    price: 100,
    rent: 10,
    rentWithHouse: 50,
    rentWithHotel: 200,
    houseCost: 50,
    hotelCost: 50,
    category: 'arrays',
    color: '#FF0000',
    houses: 0,
  };

  it('should return base rent for property with no houses', () => {
    expect(calculateRent(baseProperty)).toBe(10);
  });

  it('should return interpolated rent for 1 house', () => {
    const property = { ...baseProperty, houses: 1 };
    // Linear interpolation: 10 + (50 - 10) * (1/4) = 10 + 10 = 20
    expect(calculateRent(property)).toBe(20);
  });

  it('should return interpolated rent for 2 houses', () => {
    const property = { ...baseProperty, houses: 2 };
    // 10 + (50 - 10) * (2/4) = 10 + 20 = 30
    expect(calculateRent(property)).toBe(30);
  });

  it('should return interpolated rent for 3 houses', () => {
    const property = { ...baseProperty, houses: 3 };
    // 10 + (50 - 10) * (3/4) = 10 + 30 = 40
    expect(calculateRent(property)).toBe(40);
  });

  it('should return hotel rent for 4 houses (hotel)', () => {
    const property = { ...baseProperty, houses: 4 };
    expect(calculateRent(property)).toBe(200);
  });

  it('should return hotel rent for more than 4 houses', () => {
    const property = { ...baseProperty, houses: 5 };
    expect(calculateRent(property)).toBe(200);
  });

  it('should handle railroad properties', () => {
    const railroad: Property = {
      ...baseProperty,
      isRailroad: true,
      rent: 25,
    };
    expect(calculateRent(railroad)).toBe(25);
  });

  it('should handle utility properties', () => {
    const utility: Property = {
      ...baseProperty,
      isUtility: true,
      rent: 20,
    };
    expect(calculateRent(utility)).toBe(20);
  });
});

describe('getChallengeReward', () => {
  it('should return correct reward for easy difficulty', () => {
    expect(getChallengeReward('easy')).toBe(DIFFICULTY_REWARDS.easy);
  });

  it('should return correct reward for medium difficulty', () => {
    expect(getChallengeReward('medium')).toBe(DIFFICULTY_REWARDS.medium);
  });

  it('should return correct reward for hard difficulty', () => {
    expect(getChallengeReward('hard')).toBe(DIFFICULTY_REWARDS.hard);
  });

  it('should return medium reward for unknown difficulty', () => {
    expect(getChallengeReward('unknown' as any)).toBe(DIFFICULTY_REWARDS.medium);
  });
});

describe('resolveBankruptcy', () => {
  const createTestPlayer = (id: string, money: number, propertyIds: string[]): Player => ({
    id,
    name: `Player ${id}`,
    position: 0,
    money,
    properties: propertyIds,
    isActive: true,
  });

  const createTestProperty = (id: string, ownerId?: string): Property => ({
    id,
    name: `Property ${id}`,
    position: 1,
    price: 100,
    rent: 10,
    rentWithHouse: 50,
    rentWithHotel: 200,
    houseCost: 50,
    hotelCost: 50,
    category: 'arrays',
    color: '#FF0000',
    houses: 0,
    ownerId,
  });

  it('should transfer properties to creditor when creditor exists', () => {
    const bankruptPlayer = createTestPlayer('p1', 0, ['prop1', 'prop2']);
    const creditor = createTestPlayer('p2', 1000, []);
    const properties = [
      createTestProperty('prop1', 'p1'),
      createTestProperty('prop2', 'p1'),
    ];

    const result = resolveBankruptcy(bankruptPlayer, creditor, properties);

    expect(result.bankruptPlayer.money).toBe(0);
    expect(result.bankruptPlayer.isActive).toBe(false);
    expect(result.bankruptPlayer.properties).toEqual([]);
    expect(result.transferredProperties).toEqual(['prop1', 'prop2']);
    expect(properties[0].ownerId).toBe('p2');
    expect(properties[1].ownerId).toBe('p2');
    expect(creditor.properties).toContain('prop1');
    expect(creditor.properties).toContain('prop2');
  });

  it('should reset properties to bank when no creditor', () => {
    const bankruptPlayer = createTestPlayer('p1', 0, ['prop1', 'prop2']);
    const properties = [
      createTestProperty('prop1', 'p1'),
      createTestProperty('prop2', 'p1'),
    ];

    const result = resolveBankruptcy(bankruptPlayer, null, properties);

    expect(result.bankruptPlayer.isActive).toBe(false);
    expect(result.transferredProperties).toEqual(['prop1', 'prop2']);
    expect(properties[0].ownerId).toBeUndefined();
    expect(properties[0].houses).toBe(0);
    expect(properties[1].ownerId).toBeUndefined();
    expect(properties[1].houses).toBe(0);
  });

  it('should handle player with no properties', () => {
    const bankruptPlayer = createTestPlayer('p1', 0, []);
    const creditor = createTestPlayer('p2', 1000, []);
    const properties: Property[] = [];

    const result = resolveBankruptcy(bankruptPlayer, creditor, properties);

    expect(result.bankruptPlayer.isActive).toBe(false);
    expect(result.transferredProperties).toEqual([]);
  });
});

describe('advanceTurn', () => {
  const createTestPlayer = (id: string, isActive: boolean = true, skipNextTurn: boolean = false): Player => ({
    id,
    name: `Player ${id}`,
    position: 0,
    money: 1500,
    properties: [],
    isActive,
    skipNextTurn,
  });

  it('should advance to next active player', () => {
    const players = [
      createTestPlayer('p1'),
      createTestPlayer('p2'),
      createTestPlayer('p3'),
    ];

    const result = advanceTurn(players, 'p1', 0);

    expect(result.nextPlayerId).toBe('p2');
    expect(result.skippedPlayers).toEqual([]);
    expect(result.roundIncremented).toBe(false);
  });

  it('should skip bankrupt players', () => {
    const players = [
      createTestPlayer('p1'),
      createTestPlayer('p2', false), // bankrupt
      createTestPlayer('p3'),
    ];

    const result = advanceTurn(players, 'p1', 0);

    expect(result.nextPlayerId).toBe('p3');
    expect(result.roundIncremented).toBe(false);
  });

  it('should skip players with skipNextTurn flag and clear the flag', () => {
    const players = [
      createTestPlayer('p1'),
      createTestPlayer('p2', true, true), // skip next turn
      createTestPlayer('p3'),
    ];

    const result = advanceTurn(players, 'p1', 0);

    expect(result.nextPlayerId).toBe('p3');
    expect(result.skippedPlayers).toEqual(['p2']);
    expect(players[1].skipNextTurn).toBe(false);
  });

  it('should increment round when wrapping around', () => {
    const players = [
      createTestPlayer('p1'),
      createTestPlayer('p2'),
      createTestPlayer('p3'),
    ];

    const result = advanceTurn(players, 'p3', 0);

    expect(result.nextPlayerId).toBe('p1');
    expect(result.roundIncremented).toBe(true);
  });

  it('should handle multiple skips in sequence', () => {
    const players = [
      createTestPlayer('p1'),
      createTestPlayer('p2', false), // bankrupt
      createTestPlayer('p3', true, true), // skip turn
      createTestPlayer('p4'),
    ];

    const result = advanceTurn(players, 'p1', 0);

    expect(result.nextPlayerId).toBe('p4');
    expect(result.skippedPlayers).toEqual(['p3']);
  });

  it('should throw error when no active players', () => {
    const players = [
      createTestPlayer('p1', false),
      createTestPlayer('p2', false),
    ];

    expect(() => advanceTurn(players, 'p1', 0)).toThrow('No active players');
  });
});

describe('movePlayer', () => {
  const createTestPlayer = (): Player => ({
    id: 'p1',
    name: 'Player 1',
    position: 0,
    money: 1500,
    properties: [],
    isActive: true,
  });

  it('should move player forward without passing GO', () => {
    const player = createTestPlayer();
    player.position = 5;
    const dice: [number, number] = [3, 2];

    const result = movePlayer(player, dice);

    expect(result.position).toBe(10);
    expect(result.money).toBe(1500);
  });

  it('should award money when passing GO', () => {
    const player = createTestPlayer();
    player.position = 38;
    const dice: [number, number] = [3, 2];

    const result = movePlayer(player, dice);

    expect(result.position).toBe(5); // (38 + 5) % 40
    expect(result.money).toBe(1500 + PASS_GO_REWARD);
  });

  it('should handle landing exactly on GO', () => {
    const player = createTestPlayer();
    player.position = 35;
    const dice: [number, number] = [3, 2];

    const result = movePlayer(player, dice);

    expect(result.position).toBe(0);
    expect(result.money).toBe(1500 + PASS_GO_REWARD);
  });
});

describe('canUpgradeProperty and upgradeProperty', () => {
  const createTestPlayer = (): Player => ({
    id: 'p1',
    name: 'Player 1',
    position: 0,
    money: 1500,
    properties: ['prop1'],
    isActive: true,
  });

  const createTestProperty = (houses: number = 0): Property => ({
    id: 'prop1',
    name: 'Test Property',
    position: 1,
    price: 100,
    rent: 10,
    rentWithHouse: 50,
    rentWithHotel: 200,
    houseCost: 50,
    hotelCost: 50,
    category: 'arrays',
    color: '#FF0000',
    houses,
    ownerId: 'p1',
  });

  it('should allow upgrade when player owns property and has money', () => {
    const player = createTestPlayer();
    const property = createTestProperty(0);

    expect(canUpgradeProperty(player, property)).toBe(true);
  });

  it('should not allow upgrade when player does not own property', () => {
    const player = createTestPlayer();
    const property = createTestProperty(0);
    property.ownerId = 'p2';

    expect(canUpgradeProperty(player, property)).toBe(false);
  });

  it('should not allow upgrade when player lacks money', () => {
    const player = createTestPlayer();
    player.money = 30; // Less than houseCost of 50
    const property = createTestProperty(0);

    expect(canUpgradeProperty(player, property)).toBe(false);
  });

  it('should not allow upgrade when property already has hotel', () => {
    const player = createTestPlayer();
    const property = createTestProperty(MAX_HOUSES);

    expect(canUpgradeProperty(player, property)).toBe(false);
  });

  it('should correctly upgrade property and deduct cost', () => {
    const player = createTestPlayer();
    const property = createTestProperty(2);

    const result = upgradeProperty(player, property);

    expect(result.player.money).toBe(1500 - 50);
    expect(result.property.houses).toBe(3);
  });
});

describe('calculateNetWorth', () => {
  const createTestPlayer = (money: number, propertyIds: string[]): Player => ({
    id: 'p1',
    name: 'Player 1',
    position: 0,
    money,
    properties: propertyIds,
    isActive: true,
  });

  it('should calculate net worth with money and properties', () => {
    const player = createTestPlayer(1000, ['prop1', 'prop2']);
    const properties: Property[] = [
      {
        id: 'prop1',
        name: 'Prop 1',
        position: 1,
        price: 200,
        rent: 10,
        rentWithHouse: 50,
        rentWithHotel: 200,
        houseCost: 50,
        hotelCost: 50,
        category: 'arrays',
        color: '#FF0000',
        houses: 2, // 2 * 50 = 100
        ownerId: 'p1',
      },
      {
        id: 'prop2',
        name: 'Prop 2',
        position: 2,
        price: 300,
        rent: 15,
        rentWithHouse: 75,
        rentWithHotel: 300,
        houseCost: 100,
        hotelCost: 100,
        category: 'strings',
        color: '#0000FF',
        houses: 1, // 1 * 100 = 100
        ownerId: 'p1',
      },
    ];

    // Net worth = 1000 (money) + 200 (prop1 price) + 100 (prop1 houses) + 300 (prop2 price) + 100 (prop2 houses)
    expect(calculateNetWorth(player, properties)).toBe(1700);
  });

  it('should calculate net worth with only money', () => {
    const player = createTestPlayer(1500, []);
    const properties: Property[] = [];

    expect(calculateNetWorth(player, properties)).toBe(1500);
  });
});

describe('performPropertyLanding', () => {
  const createTestPlayer = (id: string, money: number): Player => ({
    id,
    name: `Player ${id}`,
    position: 0,
    money,
    properties: [],
    isActive: true,
  });

  const createTestProperty = (price: number, ownerId?: string): Property => ({
    id: 'prop1',
    name: 'Test Property',
    position: 1,
    price,
    rent: 10,
    rentWithHouse: 50,
    rentWithHotel: 200,
    houseCost: 50,
    hotelCost: 50,
    category: 'arrays',
    color: '#FF0000',
    houses: 0,
    ownerId,
  });

  it('should allow buying unowned property when player has money', () => {
    const player = createTestPlayer('p1', 1500);
    const property = createTestProperty(100);

    const result = performPropertyLanding(player, property);

    expect(result.action).toBe('buy');
    expect(result.success).toBe(true);
  });

  it('should not allow buying unowned property when player lacks money', () => {
    const player = createTestPlayer('p1', 50);
    const property = createTestProperty(100);

    const result = performPropertyLanding(player, property);

    expect(result.action).toBe('skip');
    expect(result.success).toBe(false);
  });

  it('should indicate own property when player lands on their own property', () => {
    const player = createTestPlayer('p1', 1500);
    const property = createTestProperty(100, 'p1');

    const result = performPropertyLanding(player, property);

    expect(result.action).toBe('own');
    expect(result.success).toBe(true);
  });

  it('should require rent payment when landing on another player\'s property', () => {
    const player = createTestPlayer('p1', 1500);
    const owner = createTestPlayer('p2', 1000);
    const property = createTestProperty(100, 'p2');

    const result = performPropertyLanding(player, property, owner);

    expect(result.action).toBe('rent');
    expect(result.success).toBe(true);
    expect(result.updates?.player?.money).toBeLessThan(1500);
    expect(result.updates?.creditor?.money).toBeGreaterThan(1000);
  });

  it('should indicate bankruptcy when player cannot afford rent', () => {
    const player = createTestPlayer('p1', 5);
    const owner = createTestPlayer('p2', 1000);
    const property = createTestProperty(100, 'p2');

    const result = performPropertyLanding(player, property, owner);

    expect(result.action).toBe('rent');
    expect(result.success).toBe(false);
    expect(result.message).toContain('BANKRUPTCY');
  });
});

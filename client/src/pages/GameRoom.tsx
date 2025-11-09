import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import EnhancedMonopolyBoard from '../components/EnhancedMonopolyBoard';
import CurrentActionDisplay from '../components/CurrentActionDisplay';
import FullCodeChallengeModal from '../components/FullCodeChallengeModal';
import CodeDuelModal from '../components/CodeDuelModal';
import EnhancedGameTimer from '../components/EnhancedGameTimer';
import GameOverModal from '../components/GameOverModal';
import DebuggingCardModal from '../components/DebuggingCardModal';
import PropertyCardModal from '../components/PropertyCardModal';
import { NotificationToast, useNotifications } from '../components/NotificationToast';
import MoneyTransferEffect, { FloatingMoneyChange } from '../components/MoneyTransferEffect';
import CameraController from '../components/camera/CameraController';
import IsometricToggle, { IsometricView } from '../components/camera/IsometricToggle';
import { useGameEffects } from '../hooks/useGameEffects';
import DiceParticles from '../components/particles/DiceParticles';
import ConfettiParticles from '../components/particles/ConfettiParticles';
import GoldenRingEffect from '../components/particles/GoldenRingEffect';
import { getProblemForProperty, getRandomProblemByDifficulty } from '../data/problemBank';
import type { Problem } from '../data/problemBank';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

interface GameState {
  _id: string;
  roomCode: string;
  status: string;
  players: any[];
  currentTurn: string;
  turnNumber: number;
  boardState: any[];
  activeDuel?: any;
  startTime?: number;
}

interface GameEvent {
  id: string;
  type: 'info' | 'dice' | 'purchase' | 'rent' | 'duel' | 'special' | 'upgrade' | 'bankrupt' | 'land';
  message: string;
  timestamp: number;
  player?: string;
  playerAvatar?: string;
  property?: string;
  amount?: number;
}

const COLOR_TO_TIER: Record<string, 'brown' | 'lightblue' | 'pink' | 'orange' | 'red' | 'yellow' | 'green' | 'darkblue' | 'railroad' | 'utility' | 'special'> = {
  '#8B4513': 'brown',
  '#87CEEB': 'lightblue',
  '#FF69B4': 'pink',
  '#FF8C00': 'orange',
  '#DC143C': 'red',
  '#FFD700': 'yellow',
  '#228B22': 'green',
  '#00008B': 'darkblue',
  '#000000': 'railroad',
  '#FFFFFF': 'utility',
  transparent: 'special',
};

const TIER_TO_DIFFICULTY: Record<string, 'easy' | 'medium' | 'hard'> = {
  brown: 'easy',
  lightblue: 'easy',
  pink: 'medium',
  orange: 'medium',
  red: 'medium',
  yellow: 'hard',
  green: 'hard',
  darkblue: 'hard',
  railroad: 'medium',
  utility: 'medium',
  special: 'medium',
};

const getPropertyTier = (property: any): string | null => {
  if (!property) return null;
  if (property.isRailroad) return 'railroad';
  if (property.isUtility) return 'utility';
  if (property.isSpecial) return 'special';
  const tier = COLOR_TO_TIER[property.color as keyof typeof COLOR_TO_TIER];
  return tier || null;
};

const getDifficultyForProperty = (property: any): 'easy' | 'medium' | 'hard' => {
  const tier = getPropertyTier(property);
  if (!tier) {
    // fallback by price
    if (property.price <= 100) return 'easy';
    if (property.price <= 200) return 'medium';
    return 'hard';
  }
  return TIER_TO_DIFFICULTY[tier];
};

const describeProperty = (property: any) => {
  if (!property) return 'Unknown space';
  if (property.specialType) {
    return property.name;
  }
  return property.name;
};

const getPlayerNameById = (players: any[], id: string | null | undefined) => {
  if (!id) return 'Player';
  const player = players?.find?.((p: any) => p.id === id);
  return player?.name || 'Player';
};

const EVENT_ICON_MAP: Record<GameEvent['type'], string> = {
  info: 'ℹ️',
  dice: '🎲',
  purchase: '🏦',
  rent: '💸',
  duel: '⚔️',
  special: '⭐',
  upgrade: '⬆️',
  bankrupt: '💀',
  land: '📍',
};

const formatRelativeTime = (timestamp: number) => {
  const diff = Date.now() - timestamp;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatMoney = (value: number | null | undefined) => {
  if (value === undefined || value === null) return '$0';
  const normalized = Number.isFinite(value) ? Math.round(value) : 0;
  return `$${Math.max(normalized, 0).toLocaleString()}`;
};

export default function GameRoom() {
  const { gameId } = useParams<{ gameId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode: _roomCode, playerId, playerName: _playerName } = location.state || {};

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showDuelModal, setShowDuelModal] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showPropertyCardModal, setShowPropertyCardModal] = useState(false);
  const [landedProperty, setLandedProperty] = useState<any>(null);
  const [landedPosition, setLandedPosition] = useState<number | undefined>();
  const [actionType, setActionType] = useState<'awaiting-action' | 'dice-rolling' | 'landed-unowned' | 'landed-owned' | 'landed-opponent' | 'landed-special' | 'landed-tax' | 'can-buy' | 'must-pay-rent' | 'code-duel' | null>('awaiting-action');
  const [diceResult, setDiceResult] = useState<{ dice1: number; dice2: number; total: number } | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [duelOpponentCode, setDuelOpponentCode] = useState('');
  const [duelOpponentStatus, setDuelOpponentStatus] = useState<'solving' | 'completed' | 'failed'>('solving');
  const [myDuelCode, setMyDuelCode] = useState('');
  const [debuggingCard, setDebuggingCard] = useState<any>(null);
  const [moneyTransfers, setMoneyTransfers] = useState<any[]>([]);
  const [floatingChanges, setFloatingChanges] = useState<any[]>([]);
  const [rent, setRent] = useState<number>(0);
  const [solvedPropertyIds, setSolvedPropertyIds] = useState<Set<number>>(new Set());
  const [propertyOwner, setPropertyOwner] = useState<any>(null);

  const hasLoggedStartRef = useRef(false);
  const previousTurnRef = useRef<string | null>(null);
  const playersRef = useRef<any[]>([]);
  const codeopolyInitialized = useRef(false);
  const previousMoneyRef = useRef<{ [key: string]: number }>({});

  // Enhanced UI hooks
  const { notifications, showNotification, closeNotification } = useNotifications();
  const effects = useGameEffects();

  // Helper function to update game state from CodeOpoly
  const updateFromCodeopolyState = (codeopolyState: any) => {
    if (!gameState) return;

    // Map CodeOpoly state to existing game state format
    const updatedPlayers = gameState.players.map(player => {
      const codeopolyPlayer = codeopolyState.players.find((p: any) => p.id === player.id || p.originalId === player.id);
      if (codeopolyPlayer) {
        return {
          ...player,
          money: codeopolyPlayer.cash,
          position: codeopolyPlayer.position,
          properties: codeopolyPlayer.properties || [],
          skipNextTurn: codeopolyPlayer.skipNextTurn || false,
        };
      }
      return player;
    });

    // Update board state with property ownership
    const updatedBoard = gameState.boardState.map(tile => {
      const codeopolyTile = codeopolyState.board.find((t: any) => t.id === tile.id);
      if (codeopolyTile && codeopolyTile.owner !== null) {
        return {
          ...tile,
          ownerId: codeopolyTile.owner,
          owner: codeopolyTile.owner
        };
      }
      return tile;
    });

    setGameState({
      ...gameState,
      players: updatedPlayers,
      boardState: updatedBoard,
      currentTurn: codeopolyState.currentTurn || gameState.currentTurn,
      turnNumber: codeopolyState.currentRound || gameState.turnNumber
    });
  };

  const handleCodeopolyTileAction = (tile: any, rollerId: string) => {
    const rollerName = getPlayerNameById(playersRef.current, rollerId);
    
    addEvent({
      type: 'land',
      message: `${rollerName} landed on ${tile.name}`,
      player: rollerName,
      property: tile.name
    });

    // Handle different tile types
    switch (tile.type) {
      case 'CODE_REVIEW':
        setActionType('landed-special');
        showNotification('info', 'Code Review!', 'Random event incoming...', 3000);
        break;
      case 'HACKATHON':
        setActionType('landed-special');
        showNotification('info', 'Hackathon Event!', 'Team competition!', 3000);
        break;
      case 'SYSTEM_CRASH':
        setActionType('landed-special');
        showNotification('error', 'System Crash!', 'Debug required!', 3000);
        break;
    }
  };

  useEffect(() => {
    if (!gameId || !playerId) {
      console.error('Missing gameId or playerId:', { gameId, playerId });
      navigate('/');
      return;
    }

    console.log('Connecting to socket:', SOCKET_URL);
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Connection error handling
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      alert('Failed to connect to game server. Please refresh the page.');
    });

    // Join game
    console.log('Joining game:', { gameId, playerId });
    newSocket.emit('join-game', { gameId, playerId });

    // Listen for game state updates
    newSocket.on('game-state', (state: GameState) => {
      console.log('Received game state:', state);
      if (!state || !state.boardState || state.boardState.length === 0) {
        console.error('Invalid game state received:', state);
        return;
      }

      const normalizedState: GameState = {
        ...state,
        startTime: state.startTime
          ? new Date(state.startTime).getTime()
          : gameState?.startTime || Date.now(),
      };

      setGameState(normalizedState);
      playersRef.current = normalizedState.players;

      // ALWAYS Initialize CodeOpoly game - force it!
      if (!codeopolyInitialized.current && normalizedState.players.length >= 1) {
        codeopolyInitialized.current = true;
        console.log('🎮 FORCE INITIALIZING CODEOPOLY GAME ENGINE!', normalizedState.players);
        console.log('Game ID:', gameId);
        
        // Small delay to ensure socket is ready
        setTimeout(() => {
          try {
            newSocket.emit('codeopoly:create', {
              gameId,
              players: normalizedState.players.map(p => ({
                id: p.id,
                name: p.name,
                socketId: p.socketId || newSocket.id
              }))
            });
            console.log('✅ CodeOpoly create event emitted successfully');
          } catch (error) {
            console.error('❌ Error initializing CodeOpoly:', error);
            // Retry once
            setTimeout(() => {
              newSocket.emit('codeopoly:create', {
                gameId,
                players: normalizedState.players.map(p => ({
                  id: p.id,
                  name: p.name,
                  socketId: p.socketId || newSocket.id
                }))
              });
            }, 1000);
          }
        }, 500);
      }

      if (!hasLoggedStartRef.current) {
        const firstPlayerName = getPlayerNameById(normalizedState.players, normalizedState.currentTurn);
        addEvent({
          type: 'info',
          message: `🎮 Game started! ${firstPlayerName}'s turn`,
        });
        hasLoggedStartRef.current = true;
        previousTurnRef.current = normalizedState.currentTurn;
      } else if (previousTurnRef.current !== normalizedState.currentTurn) {
        const nextPlayerName = getPlayerNameById(normalizedState.players, normalizedState.currentTurn);
        addEvent({
          type: 'info',
          message: `🎯 ${nextPlayerName}'s turn`,
        });
        previousTurnRef.current = normalizedState.currentTurn;
      }

      if (normalizedState.status === 'finished') {
        setShowGameOver(true);
      }
    });

    newSocket.on('joined-game', () => {
      // Request game state immediately after joining
      newSocket.emit('get-game-state', { gameId });
    });

    // Also request game state immediately in case we missed the joined-game event
    setTimeout(() => {
      newSocket.emit('get-game-state', { gameId });
    }, 100);

    // ====== CODEOPOLY EVENT HANDLERS ======

    // CodeOpoly game created
    newSocket.on('codeopoly:created', (data: any) => {
      console.log('CodeOpoly game created:', data);
      if (data.gameState) {
        updateFromCodeopolyState(data.gameState);
      }
      showNotification('success', 'Game Ready!', 'CodeOpoly game initialized', 3000);
    });

    // CodeOpoly state updates
    newSocket.on('codeopoly:stateUpdate', (data: any) => {
      if (data.gameState) {
        updateFromCodeopolyState(data.gameState);
      }
    });

    // CodeOpoly dice rolled
    newSocket.on('codeopoly:diceRolled', (data: any) => {
      const rollerId = data.playerId;
      const rollerName = getPlayerNameById(playersRef.current, rollerId);
      
      setDiceResult({ 
        dice1: data.dice[0], 
        dice2: data.dice[1], 
        total: data.total 
      });
      setActionType('dice-rolling');
      setLandedPosition(data.newPosition);
      
      // Trigger effects
      if (rollerId === playerId) {
        effects.triggerDiceRoll();
      }
      
      addEvent({
        type: 'dice',
        message: `${rollerName} rolled ${data.total} (${data.dice[0]} + ${data.dice[1]})`,
        player: rollerName,
        playerAvatar: playersRef.current.find(p => p.id === rollerId)?.avatar,
      });
      
      if (data.passedGo) {
        addEvent({
          type: 'info',
          message: `${rollerName} passed GO and collected $200!`,
          player: rollerName,
        });
        showNotification('success', 'Passed GO!', `${rollerName} collected $200`, 3000);
      }
      
      // Handle tile landing
      if (data.tile) {
        setLandedProperty(data.tile);
        handleCodeopolyTileAction(data.tile, rollerId);
      }
    });

    // CodeOpoly tile action options
    newSocket.on('codeopoly:tileAction', (data: any) => {
      const { tile } = data;
      setLandedProperty(tile);
      
      // Set action type based on tile
      if (tile.type === 'PROPERTY') {
        if (!tile.owner) {
          setActionType('can-buy');
        } else if (tile.owner !== playerId) {
          setActionType('must-pay-rent');
          const calculatedRent = Math.floor(tile.price * 0.2);
          setRent(calculatedRent);
          const owner = playersRef.current.find(p => p.id === tile.owner);
          setPropertyOwner(owner);
        }
      } else if (tile.type === 'CODE_DUEL') {
        setActionType('code-duel');
      } else if (tile.type === 'SYSTEM_CRASH') {
        setActionType('landed-special');
      }
    });

    // CodeOpoly action results
    newSocket.on('codeopoly:actionResult', (result: any) => {
      console.log('CodeOpoly action result:', result);
      
      if (result.message) {
        addEvent({
          type: result.type === 'propertyPurchased' ? 'purchase' : 
                result.type === 'rentPaid' ? 'rent' : 
                result.type === 'challengeCompleted' ? 'special' : 'info',
          message: result.message
        });
      }
      
      // Reset action state
      setActionType(null);
      setLandedProperty(null);
      setRent(0);
      setPropertyOwner(null);
    });

    // CodeOpoly challenge result
    newSocket.on('codeopoly:challengeResult', (result: any) => {
      console.log('Challenge result:', result);
      
      if (result.passed) {
        toast.success(`✅ Challenge solved! +$${result.reward} earned!`, {
          duration: 4000,
          icon: '🎉',
        });
        setSolvedPropertyIds(prev => new Set([...prev, result.propertyId]));
      } else {
        toast.error(`❌ Challenge failed! -$${result.penalty} penalty`, {
          duration: 3000,
        });
      }
      
      setActionType(null);
      setLandedProperty(null);
    });

    // CodeOpoly turn update
    newSocket.on('codeopoly:turnUpdate', (data: any) => {
      if (data.type === 'turnChanged') {
        const nextPlayerName = getPlayerNameById(playersRef.current, data.currentPlayerId);
        addEvent({
          type: 'info',
          message: `🎯 ${nextPlayerName}'s turn`,
        });
        
        if (data.skipTurn) {
          addEvent({
            type: 'info',
            message: `${nextPlayerName} is debugging and skips this turn!`,
          });
        }
      }
    });

    // CodeOpoly game over
    newSocket.on('codeopoly:gameOver', (data: any) => {
      console.log('CodeOpoly game ended:', data);
      setShowGameOver(true);
      
      if (gameState) {
        setGameState({
          ...gameState,
          status: 'finished'
        });
      }
    });

    // ====== ORIGINAL EVENT HANDLERS ======

    newSocket.on('dice-rolled', (data: any) => {
      const rollerId = data.playerId || playerId;
      const rollerName = getPlayerNameById(playersRef.current, rollerId);

      setDiceResult({ dice1: data.dice[0], dice2: data.dice[1], total: data.total });
      setActionType('dice-rolling');
      setLandedPosition(data.newPosition);
      
      // Trigger particle effects
      if (rollerId === playerId) {
        effects.triggerDiceRoll();
      }
      
      addEvent({
        type: 'dice',
        message: `${rollerName} rolled ${data.total} (${data.dice[0]} + ${data.dice[1]})`,
        player: rollerName,
        playerAvatar: playersRef.current.find(p => p.id === rollerId)?.avatar,
      });
      
      showNotification('info', 'Dice Rolled!', `${rollerName} rolled ${data.total}`, 3000);
      
      setTimeout(() => {
        newSocket.emit('get-game-state', { gameId });
      }, 2000);
    });

    newSocket.on('landed-on-space', (data: any) => {
      if (!data.property) return;

      const property = data.property;
      setLandedProperty(property);
      setLandedPosition(property.position);

      const activePlayerName = getPlayerNameById(playersRef.current, playerId);
      const propertyName = describeProperty(property);

      const activePlayer = playersRef.current.find((p: any) => p.id === playerId);
      addEvent({
        type: property.isSpecial ? 'special' : 'land',
        message: `${activePlayerName} landed on ${propertyName}`,
        player: activePlayerName,
        playerAvatar: activePlayer?.avatar,
        property: propertyName,
      });

      if (property.isSpecial) {
        setActionType('landed-special');
        handleSpecialSpace(property);
        return;
      }

      if (property.specialType === 'income-tax' || property.specialType === 'luxury-tax') {
        setActionType('landed-tax');
        addEvent({
          type: 'rent',
          message: `💸 ${activePlayerName} must pay ${property.name}`,
          player: playerId,
        });
        return;
      }

      // Show property card modal for all properties
      setShowPropertyCardModal(true);
      
      if (data.canBuy) {
        setActionType('landed-unowned');
        const difficulty = getDifficultyForProperty(property);
        const problem = getProblemForProperty(property) || getRandomProblemByDifficulty(difficulty);
        if (problem) {
          setCurrentProblem(problem);
        }
        return;
      }

      if (data.mustPayRent) {
        setActionType('landed-opponent');
        const ownerName = getPlayerNameById(playersRef.current, property.ownerId);
        const rentAmount = property.houses === 0
          ? property.rent
          : property.rentWithHouse?.[Math.max(property.houses - 1, 0)] || property.rent;
        addEvent({
          type: 'rent',
          message: `💰 ${activePlayerName} owes $${rentAmount} to ${ownerName}`,
          player: playerId,
        });
        return;
      }

      if (property.ownerId === playerId) {
        setActionType('landed-owned');
        addEvent({
          type: 'info',
          message: `🏠 ${activePlayerName} is visiting their own ${propertyName}`,
          player: playerId,
        });
      } else {
        setActionType('awaiting-action');
      }
    });

    newSocket.on('property-bought', (data: any) => {
      const property = gameState?.boardState.find((p: any) => p.id === data.propertyId);
      
      // Trigger celebration effects
      if (data.playerId === playerId && property) {
        effects.triggerPurchaseCelebration(property.color);
      }
      
      addEvent({
        type: 'purchase',
        message: `${data.playerName || 'Player'} bought ${data.propertyName}`,
        player: data.playerName || 'Player',
        playerAvatar: playersRef.current.find(p => p.id === data.playerId)?.avatar,
        property: data.propertyName,
        amount: property?.price,
      });
      
      showNotification('property', 'Property Purchased!', `${data.playerName} bought ${data.propertyName}`, 5000);
      
      setShowChallengeModal(false);
      setLandedProperty(null);
      setLandedPosition(undefined);
      setCurrentProblem(null);
      setActionType(null);
      newSocket.emit('get-game-state', { gameId });
    });

    newSocket.on('duel-started', (data: any) => {
      const problem = data.problem;
      setCurrentProblem(problem);
      setShowDuelModal(true);
      setDuelOpponentCode('');
      setDuelOpponentStatus('solving');
      setMyDuelCode('');
      
      addEvent({
        type: 'duel',
        message: `⚔️ Code Duel started!`,
        player: data.challengerId,
      });
    });

    newSocket.on('duel-code-update', (data: any) => {
      if (data.playerId !== playerId) {
        setDuelOpponentCode(data.code);
      }
    });

    newSocket.on('duel-progress', (data: any) => {
      if (data.playerId !== playerId) {
        setDuelOpponentStatus(data.solved ? 'completed' : 'failed');
      }
    });

    newSocket.on('duel-ended', (data: any) => {
      const winner = playersRef.current.find((p: any) => p.id === data.winner);
      addEvent({
        type: 'duel',
        message: `🏆 ${winner?.name || 'Player'} won the code duel!`,
        player: data.winner,
      });
      toast.success(data.winner === playerId ? '🎉 You won the duel!' : '💔 You lost the duel');
      setShowDuelModal(false);
      setCurrentProblem(null);
      newSocket.emit('get-game-state', { gameId });
    });

    newSocket.on('turn-ended', (_data: any) => {
      setActionType(null);
      setDiceResult(null);
      newSocket.emit('get-game-state', { gameId });
    });

    newSocket.on('debugging-card-drawn', (data: any) => {
      setDebuggingCard(data.card);
      addEvent({
        type: 'special',
        message: `🎴 ${getPlayerNameById(playersRef.current, data.playerId)} drew: ${data.card.title} - ${data.card.message}`,
        player: data.playerId,
      });
    });

    newSocket.on('card-effect', (data: any) => {
      if (data.moneyChange) {
        addEvent({
          type: data.moneyChange > 0 ? 'special' : 'rent',
          message: `💰 ${data.message}`,
          player: data.playerId,
        });
      }
      newSocket.emit('get-game-state', { gameId });
    });

    newSocket.on('error', (error: any) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'An error occurred');
    });

    newSocket.on('disconnect', () => {
      console.warn('Socket disconnected');
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, [gameId, playerId, navigate]);

  const addEvent = (event: Omit<GameEvent, 'id' | 'timestamp'>) => {
    setGameEvents(prev => {
      const entry: GameEvent = {
        ...event,
        id: `event-${Date.now()}-${Math.random()}`,
        timestamp: Date.now(),
      };
      const next = [...prev, entry];
      return next.slice(-10);
    });
  };

  const handleSpecialSpace = (property: any) => {
    if (property.specialType === 'go-to-jail') {
      // Move to jail
      toast.error('🚨 Go to Jail!');
      addEvent({ type: 'special', message: '🚨 Sent directly to Jail!', player: playerId });
    } else if (property.specialType === 'chance') {
      // Draw chance card
      toast('🎲 Chance card drawn!', { icon: '🎲' });
      addEvent({ type: 'special', message: '🎲 Drew a Chance card', player: playerId });
    } else if (property.specialType === 'community-chest') {
      // Draw community chest card
      toast('📦 Community Chest card drawn!', { icon: '📦' });
      addEvent({ type: 'special', message: '📦 Drew a Community Chest card', player: playerId });
      } else if (property.specialType === 'go') {
      // Trigger GO celebration
      if (playerId) {
        effects.triggerGoPass();
      }
      showNotification('money', 'Passed GO!', 'Collect $200', 4000);
      addEvent({ type: 'special', message: 'Passed GO and collected $200', player: playerId });
    }
  };

  const handleRollDice = (_dice1?: number, _dice2?: number) => {
    if (!socket || !gameId || !playerId) return;

    if (playersRef.current.length < 2) {
      toast.error('You need at least 2 players. Share your room code and wait for a friend to join.');
      return;
    }

    // Use CodeOpoly event if initialized, otherwise fall back to original
    if (codeopolyInitialized.current) {
      socket.emit('codeopoly:rollDice', { gameId, playerId });
    } else {
      socket.emit('roll-dice', { gameId, playerId });
    }
  };

  const handleSolveAndBuy = async (code: string, language: string) => {
    if (!currentProblem || !landedProperty || !socket || !gameId || !playerId) return;

    // MOCKED: Always succeed for demo
    const playerName = getPlayerNameById(playersRef.current, playerId);
    const coinsEarned = landedProperty.price;
    
    // Show success notification
    toast.success(`✅ PASS: Accepted Solution! +${coinsEarned} Algo-Coins`, {
      duration: 4000,
      icon: '🎉',
    });

    addEvent({
      type: 'purchase',
      message: `✅ ${playerName} solved "${currentProblem.title}"! +${coinsEarned} A-C`,
      player: playerId,
    });

    // Automatically deduct cost and buy property
    socket.emit('buy-property', {
      gameId,
      playerId,
      propertyId: landedProperty.id,
      code,
      language,
    });

    // Close modal after a brief delay
    setTimeout(() => {
      setShowChallengeModal(false);
      setCurrentProblem(null);
      setLandedProperty(null);
      setActionType(null);
    }, 1500);
  };


  const handlePayRent = () => {
    if (socket && gameId && playerId && landedProperty) {
      socket.emit('pay-rent', {
        gameId,
        playerId,
        propertyId: landedProperty.id,
        amount: rent,
        ownerId: propertyOwner?.id || landedProperty.ownerId
      });
      
      setActionType(null);
      setRent(0);
      setPropertyOwner(null);
      setLandedProperty(null);
    }
  };

  const handleCodeDuel = () => {
    if (socket && gameId && playerId && landedProperty) {
      const owner = playersRef.current.find((p: any) => p.id === landedProperty.ownerId);
      if (owner) {
        socket.emit('challenge-duel', {
          gameId,
          challengerId: playerId,
          defenderId: owner.id,
          propertyId: landedProperty.id,
        });
        addEvent({
          type: 'duel',
          message: `⚔️ ${getPlayerNameById(playersRef.current, playerId)} challenged ${owner.name} to a code duel!`,
          player: playerId,
        });
      }
    }
  };

  const handlePropertyCardBuy = () => {
    if (!currentProblem) {
      // Get problem if not already set
      const difficulty = getDifficultyForProperty(landedProperty);
      const problem = getProblemForProperty(landedProperty) || getRandomProblemByDifficulty(difficulty);
      if (problem) {
        setCurrentProblem(problem);
      }
    }
    setShowPropertyCardModal(false);
    setShowChallengeModal(true);
  };

  const handlePropertyCardSkip = () => {
    setShowPropertyCardModal(false);
    setActionType(null);
    setLandedProperty(null);
    setLandedPosition(undefined);
  };

  const handleUpgrade = () => {
    if (socket && gameId && playerId && landedProperty) {
      socket.emit('upgrade-property', {
        gameId,
        playerId,
        propertyId: landedProperty.id,
      });
      toast.success('🏠 Property upgraded!');
      addEvent({
        type: 'upgrade',
        message: `🏠 ${getPlayerNameById(playersRef.current, playerId)} upgraded ${describeProperty(landedProperty)}`,
        player: playerId,
      });
      setActionType(null);
      setLandedProperty(null);
    }
  };

  const handleDuelCodeUpdate = (code: string) => {
    setMyDuelCode(code);
    if (socket && gameId && playerId) {
      socket.emit('duel-code-update', { gameId, playerId, code });
    }
  };

  const handleDuelWin = () => {
    if (socket && gameId && playerId) {
      socket.emit('submit-duel-code', {
        gameId,
        playerId,
        code: myDuelCode,
        language: 'javascript',
      });
    }
  };

  const handleDuelLose = () => {
    // Duel lost - handled by server
  };

  const handleTimeUp = () => {
    if (socket && gameId) {
      socket.emit('game-time-up', { gameId });
    }
    addEvent({
      type: 'info',
      message: '⏰ Time is up! Calculating winner...',
      player: playerId,
    });
  };

  const calculateNetWorth = (player: any) => {
    const propertyValue = gameState?.boardState
      .filter(p => p.ownerId === player.id)
      .reduce((sum, p) => sum + p.price + (p.houses * p.houseCost || 0), 0) || 0;
    return player.money + propertyValue;
  };

  useEffect(() => {
    if (!gameState) return;

    const isPlayersTurn = gameState.currentTurn === playerId;

    if (isPlayersTurn) {
      if (!diceResult && !showChallengeModal && !showDuelModal && !landedProperty) {
        setActionType(prev => (prev === null ? 'awaiting-action' : prev));
      }
    } else if (actionType === 'awaiting-action') {
      setActionType(null);
    }
  }, [gameState, playerId, diceResult, showChallengeModal, showDuelModal, landedProperty, actionType]);

  // Track money changes for animations - MUST be before early return
  useEffect(() => {
    if (!gameState || !gameState.players) return;
    
    gameState.players.forEach((player: any) => {
      const prevMoney = previousMoneyRef.current[player.id] || player.money;
      if (prevMoney !== player.money) {
        const change = player.money - prevMoney;
        if (change !== 0 && Math.abs(change) > 0) {
          // Add floating money change
          const floatingChange = {
            id: `${player.id}-${Date.now()}`,
            amount: change,
            position: { 
              x: window.innerWidth / 2, 
              y: window.innerHeight / 2 
            },
          };
          setFloatingChanges(prev => [...prev, floatingChange]);
          
          // Show notification for significant changes
          if (Math.abs(change) >= 200) {
            showNotification(
              'money',
              change > 0 ? 'Money Received!' : 'Money Spent!',
              `${change > 0 ? '+' : ''}$${Math.abs(change)}`,
              3000
            );
          }
        }
        previousMoneyRef.current[player.id] = player.money;
      }
    });
  }, [gameState?.players, showNotification]);

  if (!gameState || !gameState.boardState || gameState.boardState.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center flex-col gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
        <div className="text-white text-lg font-mono">Loading game board...</div>
        {socket && (
          <div className="text-white/60 text-sm font-mono">
            Socket: {socket.connected ? '✅ Connected' : '❌ Disconnected'}
          </div>
        )}
        {gameId && (
          <div className="text-white/60 text-sm font-mono">
            Game ID: {gameId}
          </div>
        )}
        {playerId && (
          <div className="text-white/60 text-sm font-mono">
            Player ID: {playerId}
          </div>
        )}
        <button
          onClick={() => {
            if (socket && gameId) {
              console.log('Manually requesting game state');
              socket.emit('get-game-state', { gameId });
            }
          }}
          className="mt-4 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-mono"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const currentPlayer = gameState.players.find((p: any) => p.id === playerId);
  const totalPlayers = gameState.players.length;
  const hasEnoughPlayers = totalPlayers >= 2;
  const playersNeeded = Math.max(0, 2 - totalPlayers);
  const isMyTurn = gameState.currentTurn === playerId;
  const computedPropertyOwner = landedProperty?.ownerId 
    ? gameState.players.find((p: any) => p.id === landedProperty.ownerId)
    : null;
  const computedRent = landedProperty && computedPropertyOwner 
    ? (landedProperty.houses === 0 
        ? landedProperty.rent 
        : landedProperty.rentWithHouse?.[landedProperty.houses - 1] || landedProperty.rent)
    : 0;

  // Calculate winner for game over
  const winner = gameState.status === 'finished' 
    ? gameState.players.reduce((prev, curr) => 
        calculateNetWorth(curr) > calculateNetWorth(prev) ? curr : prev
      )
    : null;

  const recentEvents = gameEvents.slice(-6).reverse();
  const canRoll = isMyTurn && (!actionType || actionType === 'awaiting-action') && hasEnoughPlayers;

  return (
    <div className="game-container">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            color: '#fff',
            border: '2px solid #10b981',
            borderRadius: '12px',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.5)',
            fontSize: '15px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Header - Clean & Professional */}
      <header className="game-header-compact">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-bold text-white tracking-wide">
            CODEOPOLY
          </h1>
          <button
            onClick={() => {
              navigator.clipboard.writeText(gameState.roomCode);
              showNotification('success', 'Copied!', `Room code ${gameState.roomCode} copied to clipboard`, 2000);
            }}
            className="badge-clean text-sm font-medium"
            title="Copy room code"
          >
            Room {gameState.roomCode}
          </button>
        </div>

          <div className="flex items-center gap-4">
            {codeopolyInitialized.current ? (
              <div className="px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/50 rounded-lg">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">🎮 CodeOpoly Active</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  if (socket && gameId && gameState?.players.length >= 1) {
                    codeopolyInitialized.current = true;
                    socket.emit('codeopoly:create', {
                      gameId,
                      players: gameState.players.map(p => ({
                        id: p.id,
                        name: p.name,
                        socketId: p.socketId || socket.id
                      }))
                    });
                    showNotification('info', 'CodeOpoly', 'Initializing game engine...', 2000);
                  }
                }}
                className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg hover:from-yellow-500/30 hover:to-orange-500/30 transition-all"
              >
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wide">⚡ Activate CodeOpoly</span>
              </button>
            )}
            <div className="hidden md:flex items-center gap-2 text-sm text-slate-300">
              <span className={`status-dot ${hasEnoughPlayers ? 'active' : 'waiting'}`}></span>
              <span className="font-medium">
                {hasEnoughPlayers ? `${gameState.players.length} players` : 'Waiting for players'}
              </span>
            </div>

          <div className="flex items-center gap-3 px-4 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-sm shadow-md">
              {currentPlayer?.avatar || '👤'}
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wide font-medium">Current Player</div>
              <div className="text-sm font-semibold text-white">{currentPlayer?.name || 'Waiting...'}</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center px-3 py-2 bg-slate-700/50 rounded-lg border border-slate-600/50">
            <span className="text-sm font-medium text-slate-300">Turn {gameState.turnNumber}</span>
          </div>
        </div>
      </header>

      {/* Integrated Game Layout */}
      <div className="game-stage">
        <div className="integrated-game-container">
          {/* Left Panel - Players */}
          <div className="side-panel left-panel">
            <div className="panel-header">
              <h3 className="panel-title">Players</h3>
              <span className="player-count">{gameState.players.length}/4</span>
            </div>
            <div className="players-list">
              {gameState.players.map((player: any) => {
                const isActive = player.id === gameState.currentTurn;
                const isYou = player.id === playerId;
                
                return (
                  <div key={player.id} className={`player-item ${isActive ? 'active' : ''} ${isYou ? 'is-you' : ''}`}>
                    <div className="player-avatar" style={{ backgroundColor: player.color || '#3B82F6' }}>
                      {player.avatar || '👤'}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-money">{formatMoney(player.money)}</div>
                    </div>
                    {isActive && <div className="active-indicator"></div>}
                  </div>
                );
              })}
            </div>
            
            <div className="panel-divider"></div>
            
            <div className="panel-header">
              <h3 className="panel-title">Live Feed</h3>
              <div className="live-indicator">
                <span className="live-dot"></span>
                LIVE
              </div>
            </div>
            <div className="event-feed">
              {recentEvents.length === 0 && (
                <div className="empty-feed">No events yet</div>
              )}
              {recentEvents.map((event) => (
                <div key={event.id} className="feed-event">
                  <span className="event-icon">{EVENT_ICON_MAP[event.type]}</span>
                  <div className="event-content">
                    <div className="event-message">{event.message}</div>
                    <div className="event-time">{formatRelativeTime(event.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center - Game Board */}
          <div className="board-container">
            <div className="relative w-full h-full">
              <CameraController enableParallax={true} enableShake={true}>
                <IsometricView>
                  <IsometricToggle />
                  <EnhancedMonopolyBoard
                    boardState={gameState.boardState}
                    players={gameState.players}
                    currentPlayer={currentPlayer}
                    onTileClick={(property) => {
                      setLandedProperty(property);
                    }}
                    landedPosition={landedPosition}
                    gameEvents={gameEvents}
                  />
                </IsometricView>
              </CameraController>

              {!hasEnoughPlayers && (
                <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-md flex items-center justify-center z-30 pointer-events-none rounded-3xl">
                  <div className="info-card pointer-events-auto text-center max-w-xs">
                    <div className="text-4xl mb-2">👥</div>
                    <h2 className="text-lg font-bold text-white mb-1">Waiting for Players</h2>
                    <p className="text-compact mb-2 text-gray-300">
                      Share room code with a friend to start.
                    </p>
                    <div className="badge-clean text-base px-4 py-2 mb-2">
                      {gameState.roomCode}
                    </div>
                    <p className="text-xs text-cyan-300">
                      {playersNeeded === 1 ? 'Need 1 more player' : `Need ${playersNeeded} more players`}
                    </p>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="pointer-events-auto">
                    <CurrentActionDisplay
                      actionType={
                        actionType === 'can-buy' ? 'landed-unowned' :
                        actionType === 'must-pay-rent' ? 'landed-opponent' :
                        actionType === 'code-duel' ? 'landed-special' :
                        actionType
                      }
                      diceResult={diceResult || undefined}
                      property={landedProperty}
                      owner={propertyOwner || computedPropertyOwner}
                      rent={rent || computedRent}
                      onRollDice={handleRollDice}
                      onSolveAndBuy={() => {
                        if (currentProblem) {
                          setShowChallengeModal(true);
                        }
                      }}
                      onSkip={() => {
                        if (codeopolyInitialized.current) {
                          socket?.emit('codeopoly:tileAction', {
                            gameId,
                            playerId,
                            action: 'skip',
                            data: {}
                          });
                        }
                        setActionType(null);
                        setLandedProperty(null);
                      }}
                      onPayRent={() => {
                        if (codeopolyInitialized.current) {
                          socket?.emit('codeopoly:tileAction', {
                            gameId,
                            playerId,
                            action: 'payRent',
                            data: {}
                          });
                        } else {
                          handlePayRent();
                        }
                      }}
                      onBuy={() => {
                        if (codeopolyInitialized.current && landedProperty) {
                          socket?.emit('codeopoly:tileAction', {
                            gameId,
                            playerId,
                            action: 'buy',
                            data: { propertyId: landedProperty.id }
                          });
                        }
                      }}
                      onCodeDuel={handleCodeDuel}
                      onUpgrade={handleUpgrade}
                      onContinue={() => {
                        setActionType(null);
                        setLandedProperty(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Timer & Controls */}
          <div className="side-panel right-panel">
            <div className="panel-header">
              <h3 className="panel-title">Game Timer</h3>
              <span className="turn-counter">Turn {gameState.turnNumber}</span>
            </div>
            
            <div className="timer-section">
              <EnhancedGameTimer
                duration={180}
                onTimeUp={handleTimeUp}
                isPaused={!hasEnoughPlayers}
              />
            </div>
            
            <div className="panel-divider"></div>
            
            <div className="your-turn-section">
              <h4 className="section-title">Your Turn</h4>
              <button
                onClick={() => handleRollDice()}
                disabled={!canRoll}
                className={`roll-dice-btn ${canRoll ? 'active' : 'disabled'}`}
              >
                <span className="dice-icon">🎲</span>
                {canRoll
                  ? 'Roll Dice'
                  : !hasEnoughPlayers
                  ? 'Waiting for players'
                  : 'Not your turn'}
              </button>
            </div>
            
            <div className="panel-divider"></div>
            
            <div className="stats-section">
              <h4 className="section-title">Your Stats</h4>
              <div className="stat-item">
                <span className="stat-label">Balance</span>
                <span className="stat-value">{formatMoney(currentPlayer?.money)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Properties</span>
                <span className="stat-value">{currentPlayer?.properties?.length || 0}</span>
              </div>
            </div>
            
            <div className="help-section">
              <h4 className="section-title">Quick Tips</h4>
              <div className="tips-list">
                <div className="tip">Press <kbd>Space</kbd> to roll</div>
                <div className="tip">Press <kbd>Enter</kbd> to submit</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Particle Effects */}
      <DiceParticles trigger={effects.diceParticles} />
      <ConfettiParticles trigger={effects.confettiParticles} />
      <GoldenRingEffect trigger={effects.goldenRing} />

      {/* Notification Toasts */}
      <NotificationToast 
        notifications={notifications}
        onClose={closeNotification}
      />

      {/* Money Transfer Effects */}
      <MoneyTransferEffect
        transfers={moneyTransfers}
        onComplete={(id) => setMoneyTransfers(transfers => transfers.filter(t => t.id !== id))}
      />

      {/* Floating Money Changes */}
      {floatingChanges.map((change) => (
        <FloatingMoneyChange
          key={change.id}
          amount={change.amount}
          position={change.position}
          onComplete={() => setFloatingChanges(changes => changes.filter(c => c.id !== change.id))}
        />
      ))}

      {/* Property Card Modal */}
      {showPropertyCardModal && landedProperty && (
        <PropertyCardModal
          property={landedProperty}
          owner={landedProperty.ownerId ? gameState?.players.find((p: any) => p.id === landedProperty.ownerId) : null}
          currentPlayerMoney={currentPlayer?.money || 0}
          isOpen={showPropertyCardModal}
          onClose={handlePropertyCardSkip}
          onBuy={handlePropertyCardBuy}
          onSkip={handlePropertyCardSkip}
          onPayRent={actionType === 'landed-opponent' ? handlePayRent : undefined}
        />
      )}

      {/* Code Challenge Modal */}
      {showChallengeModal && currentProblem && landedProperty && (
        <FullCodeChallengeModal
          problem={currentProblem}
          propertyName={landedProperty.name}
          propertyPrice={landedProperty.price}
          onSubmit={handleSolveAndBuy}
          onGiveUp={() => {
            setShowChallengeModal(false);
            setCurrentProblem(null);
            setLandedProperty(null);
            setActionType(null);
          }}
          timeLimit={300}
        />
      )}

      {/* Code Duel Modal */}
      {showDuelModal && currentProblem && gameState?.activeDuel && (
        <CodeDuelModal
          problem={currentProblem}
          opponent={gameState.players.find((p: any) => 
            p.id === (gameState.activeDuel.challengerId === playerId 
              ? gameState.activeDuel.defenderId 
              : gameState.activeDuel.challengerId)
          )}
          onWin={handleDuelWin}
          onLose={handleDuelLose}
          onCodeUpdate={handleDuelCodeUpdate}
          opponentCode={duelOpponentCode}
          opponentStatus={duelOpponentStatus}
          timeLimit={300}
        />
      )}

      {/* Debugging Card Modal */}
      {debuggingCard && (
        <DebuggingCardModal
          card={debuggingCard}
          onClose={() => {
            setDebuggingCard(null);
            socket?.emit('get-game-state', { gameId });
          }}
        />
      )}

      {/* Game Over Modal */}
      {showGameOver && winner && gameState && (
        <GameOverModal
          players={gameState.players.map((p: any) => ({
            ...p,
            netWorth: calculateNetWorth(p),
          }))}
          winner={{
            ...winner,
            netWorth: calculateNetWorth(winner),
          }}
          onClose={() => navigate('/')}
        />
      )}
    </div>
  );
}

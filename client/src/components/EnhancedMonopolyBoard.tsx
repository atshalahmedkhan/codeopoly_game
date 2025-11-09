import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AnimatedPlayerToken from './AnimatedPlayerToken';
import { soundManager } from '../lib/soundEffects';

interface Property {
  id: string;
  name: string;
  position: number;
  price: number;
  rent: number;
  rentWithHouse?: number[];
  color: string;
  ownerId?: string;
  houses: number;
  isSpecial?: boolean;
  specialType?: 'go' | 'jail' | 'free-parking' | 'go-to-jail' | 'chance' | 'community-chest';
  isRailroad?: boolean;
  isUtility?: boolean;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
  position: number;
  money: number;
  properties: string[];
  color?: string;
}

interface GameEvent {
  type: 'info' | 'dice' | 'purchase' | 'rent' | 'duel' | 'special' | 'upgrade' | 'bankrupt' | 'land';
  message: string;
  player?: string;
  timestamp?: number;
}

interface EnhancedMonopolyBoardProps {
  boardState: Property[];
  players: Player[];
  currentPlayer: Player | null;
  onTileClick: (property: Property) => void;
  landedPosition?: number;
  gameEvents?: GameEvent[];
}

export default function EnhancedMonopolyBoard({
  boardState,
  players,
  currentPlayer,
  onTileClick,
  landedPosition,
  gameEvents,
}: EnhancedMonopolyBoardProps) {
  const [hoveredProperty, setHoveredProperty] = useState<number | null>(null);
  const [glowingTile, setGlowingTile] = useState<number | null>(landedPosition || null);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (landedPosition !== undefined) {
      setGlowingTile(landedPosition);
      setTimeout(() => setGlowingTile(null), 3000);
    }
  }, [landedPosition]);

  const getSpaceAtPosition = (pos: number) => {
    return boardState.find(p => p.position === pos);
  };

  const getPlayersOnSpace = (pos: number) => {
    return players.filter(p => p.position === pos);
  };

  const getPropertyStyle = (property: Property | undefined, pos: number) => {
    if (!property) return {};
    
    const isHovered = hoveredProperty === pos;
    const isGlowing = glowingTile === pos;
    const isOwned = !!property.ownerId;
    const owner = players.find(p => p.id === property.ownerId);
    
    // Extract RGB from hex color for CSS variable
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '79, 209, 197';
    };
    const propertyColorRgb = hexToRgb(property.color);
    
    return {
      background: property.isSpecial 
        ? `linear-gradient(135deg, ${property.color}40, ${property.color}60)`
        : isOwned
        ? `linear-gradient(135deg, rgba(20, 30, 50, 0.6), rgba(20, 30, 50, 0.7))` // Dimmer for owned properties
        : `linear-gradient(135deg, rgba(20, 30, 50, 0.9), rgba(20, 30, 50, 0.95))`, // Brighter for unowned
      border: isOwned && owner
        ? `3px solid ${owner.color || '#FFD700'}`
        : `2px solid rgba(255, 255, 255, 0.2)`, // More visible border for unowned
      opacity: isOwned && !isHovered ? 0.7 : 1, // Dim owned properties when not hovered
      boxShadow: isGlowing
        ? `0 0 30px ${property.color}, 0 0 60px ${property.color}80, 0 0 90px ${property.color}60, inset 0 0 30px ${property.color}40, 0 12px 32px rgba(0,0,0,0.7), 0 0 40px rgba(${propertyColorRgb}, 0.8)`
        : isHovered
        ? `0 12px 32px rgba(0,0,0,0.7), 0 0 40px rgba(${propertyColorRgb}, 0.8), inset 0 1px 2px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)`
        : isOwned
        ? `0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.05), 0 0 10px rgba(${propertyColorRgb}, 0.2)` // Subtle shadow for owned
        : `0 4px 12px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1), 0 0 20px rgba(${propertyColorRgb}, 0.4)`, // More prominent for unowned
      // Prevent hover scale/translate from breaking grid alignment
      transform: isHovered 
        ? 'perspective(1000px) rotateX(0deg)' 
        : 'perspective(1000px) rotateX(0deg)',
      zIndex: isHovered ? 100 : isGlowing ? 10 : 1,
      transition: 'box-shadow 0.25s ease, opacity 0.25s ease, z-index 0.25s ease',
      '--property-color': property.color,
    } as React.CSSProperties;
  };

  const renderCornerSpace = (property: Property | undefined, className: string, icon: string) => {
    const playersHere = property ? getPlayersOnSpace(property.position) : [];
    const isGlowing = property && glowingTile === property.position;
    const isHovered = property && hoveredProperty === property.position;
    const specialType = property?.specialType;
    
    // Corner spaces: 128px x 128px (w-32 h-32) per spec
    return (
      <div 
        className={`w-40 h-40 relative ${className}`}
        onMouseEnter={() => property && setHoveredProperty(property.position)}
        onMouseLeave={() => property && setHoveredProperty(null)}
      >
        <motion.div
          animate={isGlowing ? { 
            scale: [1, 1.1, 1],
          } : isHovered ? {
            scale: 1.05,
          } : {}}
          transition={{ duration: 0.5 }}
          className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 border-4 border-cyan-400 rounded-lg flex items-center justify-center relative overflow-hidden group hover:border-cyan-300 transition-all"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent"></div>
          <div className="text-center z-10">
            {/* Special effects for each corner */}
            {specialType === 'free-parking' && (
              <motion.div
                className="parking-icon text-6xl mb-2"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, ease: 'easeInOut' }}
                style={{
                  filter: 'drop-shadow(0 4px 12px rgba(66, 153, 225, 0.6))',
                }}
              >
                🅿️
              </motion.div>
            )}
            
            {specialType === 'go-to-jail' && (
              <>
                <motion.div
                  className="police-light absolute top-2 left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full"
                  animate={{
                    background: [
                      'radial-gradient(circle, #E53E3E 0%, transparent 70%)',
                      'radial-gradient(circle, #3182CE 0%, transparent 70%)',
                      'radial-gradient(circle, #E53E3E 0%, transparent 70%)',
                    ],
                    boxShadow: [
                      '0 0 20px #E53E3E',
                      '0 0 20px #3182CE',
                      '0 0 20px #E53E3E',
                    ],
                  }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
                <motion.div
                  className="jail-arrow absolute bottom-4 text-2xl"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                >
                  ⬇️
                </motion.div>
              </>
            )}
            
            {specialType === 'jail' && (
              <>
                <div className="jail-bars absolute inset-0 pointer-events-none" style={{
                  background: 'repeating-linear-gradient(90deg, transparent 0px, transparent 15px, rgba(255, 255, 255, 0.1) 15px, rgba(255, 255, 255, 0.1) 18px)',
                }} />
                <motion.div
                  className="jail-lock text-6xl mb-2"
                  animate={{
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{ duration: 5, ease: 'easeInOut', times: [0, 0.02, 0.04, 0.1] }}
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8))',
                  }}
                >
                  🔒
                </motion.div>
              </>
            )}
            
            {specialType === 'go' && (
              <>
                <motion.div
                  className="go-arrow text-5xl mb-2"
                  animate={{ x: [-4, 4, -4] }}
                  transition={{ duration: 1.5, ease: 'easeInOut' }}
                >
                  ➡️
                </motion.div>
                <motion.div
                  className="go-amount text-2xl font-black text-yellow-300"
                  animate={{
                    textShadow: [
                      '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(251, 211, 141, 0.8)',
                      '0 2px 8px rgba(0, 0, 0, 0.6), 0 0 30px rgba(251, 211, 141, 1)',
                      '0 2px 4px rgba(0, 0, 0, 0.5), 0 0 20px rgba(251, 211, 141, 0.8)',
                    ],
                  }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                >
                  $200
                </motion.div>
              </>
            )}
            
            {/* Default icon if no special type */}
            {!specialType && (
              <motion.div
                className="text-5xl mb-2"
                animate={isGlowing ? { 
                  scale: [1, 1.3, 1],
                  rotate: [0, 360],
                } : {}}
                transition={{ duration: 2 }}
              >
                {icon}
              </motion.div>
            )}
            
            {property && (
              <>
                <div 
                  className="text-cyan-400 font-bold mb-1 text-center px-2"
                  style={{
                    fontSize: 'clamp(16px, 2.2vmin, 26px)',
                    textShadow: '0 2px 6px rgba(0, 0, 0, 0.9)',
                  }}
                >
                  {property.name}
                </div>
                {property.name === 'GO' && (
                  <div 
                    className="text-green-400"
                    style={{
                      fontSize: 'clamp(9px, 1vmin, 12px)',
                      textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
                    }}
                  >
                    Collect $200
                  </div>
                )}
                
                {/* Players */}
                {playersHere.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex gap-1 flex-wrap max-w-[80%]">
                    {playersHere.map(p => (
                      <AnimatedPlayerToken
                        key={p.id}
                        player={p}
                        isCurrentTurn={currentPlayer?.id === p.id}
                        isMoving={false}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/5 transition-all"></div>
        </motion.div>
      </div>
    );
  };

const renderProperty = (property: Property, orientation: 'horizontal' | 'vertical', isTop: boolean = false) => {
    const playersHere = getPlayersOnSpace(property.position);
    const isOwned = !!property.ownerId;
    const owner = players.find(p => p.id === property.ownerId);
    const isHovered = hoveredProperty === property.position;
    
    // Handle special spaces (Chance, Community Chest)
    if (property.isSpecial && (property.specialType === 'chance' || property.specialType === 'community-chest')) {
      return (
        <motion.div
          key={property.id}
          className="relative bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 rounded-lg flex flex-col items-center justify-center hover:border-cyan-400 transition-all group cursor-pointer overflow-hidden"
          style={{
            width: orientation === 'horizontal' ? '100px' : '100%',
            height: orientation === 'vertical' ? '100px' : '100%',
            minWidth: '100px',
            minHeight: '100px',
          }}
          onMouseEnter={() => {
            setHoveredProperty(property.position);
            soundManager.playPropertyLanding();
          }}
          onMouseLeave={() => setHoveredProperty(null)}
          onClick={() => onTileClick(property)}
        >
          <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
            {property.specialType === 'chance' ? '❓' : '📦'}
          </span>
          <div className="text-cyan-300 text-xs font-bold text-center px-2" 
               style={{ 
                 fontSize: 'clamp(10px, 1.2vw, 14px)',
                 textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
               }}>
            {property.name}
          </div>
        </motion.div>
      );
    }
    
    // CRITICAL FIX: Readable text orientation for all sides
    const getCardTransform = (orientation: string, isTop: boolean) => {
      if (orientation === 'vertical') {
        return 'rotate(90deg)'; // Card rotates 90°, text will be adjusted inside
      } else if (isTop) {
        return 'rotate(180deg)'; // Card rotates 180°, text will be adjusted inside
      } else {
        return 'rotate(0deg)'; // Bottom row: normal orientation
      }
    };

    // CRITICAL FIX: Standard card sizes per design spec
    // Regular properties: 120px x 160px (increased for readability)
    const cardSize = orientation === 'horizontal'
      ? 'h-40 min-h-[160px] w-30 min-w-[120px]' // 120px x 160px per spec
      : 'h-full min-h-[160px] w-30 min-w-[120px]'; // 120px width, full height

    return (
      <motion.div
        key={property.id}
        className={`cursor-pointer relative bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-lg overflow-hidden hover:scale-105 transition-all duration-200 ${isOwned ? 'ring-2 ring-white/50' : ''}`}
        style={{
          ...getPropertyStyle(property, property.position),
          width: orientation === 'horizontal' ? '90px' : '100%',
          height: orientation === 'vertical' ? '90px' : '100%',
          minWidth: '90px',
          minHeight: '90px',
        }}
        onMouseEnter={() => {
          setHoveredProperty(property.position);
          soundManager.playPropertyLanding();
        }}
        onMouseLeave={() => setHoveredProperty(null)}
        onClick={() => onTileClick(property)}
      >
        {/* Enhanced hover tooltip - Shows property details */}
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-[100] pointer-events-none"
            style={{ filter: 'drop-shadow(0 10px 40px rgba(0,0,0,0.8))' }}
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl rounded-xl p-5 border-2 border-cyan-400 shadow-2xl min-w-[280px] max-w-[320px]"
                 style={{
                   boxShadow: '0 0 40px rgba(0, 212, 255, 0.4), inset 0 0 20px rgba(0, 212, 255, 0.1)',
                 }}>
              {/* Property Header */}
              <div className="mb-3 pb-3 border-b border-cyan-400/30">
                <div className="text-xl font-black text-white mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                  {property.name}
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: property.color, boxShadow: `0 0 10px ${property.color}80` }}></div>
              </div>
              
              {/* Property Details */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-300 font-medium">Purchase Price:</span>
                  <span className="text-yellow-300 font-mono font-black text-base">${property.price.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-slate-300 font-medium">Base Rent:</span>
                  <span className="text-emerald-300 font-mono font-black text-base">${property.rent.toLocaleString()}</span>
                </div>
                
                {property.rentWithHouse && property.rentWithHouse.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                    <div className="text-slate-300 font-medium mb-1.5">Rent with Houses:</div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {property.rentWithHouse.slice(0, 4).map((rent, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="text-slate-400">{idx + 1} House:</span>
                          <span className="text-green-300 font-mono font-bold">${rent}</span>
                        </div>
                      ))}
                      {property.rentWithHouse.length >= 5 && (
                        <div className="flex justify-between col-span-2 pt-1 border-t border-slate-700">
                          <span className="text-slate-400">Hotel:</span>
                          <span className="text-red-300 font-mono font-bold">${property.rentWithHouse[4]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {isOwned && owner && (
                  <>
                    <div className="flex justify-between items-center bg-slate-800/50 rounded-lg px-3 py-2">
                      <span className="text-slate-300 font-medium">Owner:</span>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-white" style={{ backgroundColor: owner.color }}></div>
                        <span className="text-white font-bold">{owner.name}</span>
                      </div>
                    </div>
                    {property.houses > 0 && (
                      <div className="flex justify-between items-center bg-slate-800/50 rounded-lg px-3 py-2">
                        <span className="text-slate-300 font-medium">Upgrades:</span>
                        <span className="text-green-300 font-bold text-base">
                          {property.houses === 5 ? '🏨 Hotel' : `🏠 ${property.houses} House${property.houses > 1 ? 's' : ''}`}
                        </span>
                      </div>
                    )}
                  </>
                )}
                
                {!isOwned && (
                  <div className="bg-emerald-900/30 border border-emerald-500/50 rounded-lg px-3 py-2 text-center">
                    <span className="text-emerald-300 font-bold text-sm">Available to Purchase!</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="w-4 h-4 bg-slate-900 border-r-2 border-b-2 border-cyan-400 transform rotate-45"></div>
            </div>
          </motion.div>
        )}
        {/* Animated border glow on hover */}
        {hoveredProperty === property.position && (
          <motion.div
            className="absolute inset-[-2px] rounded pointer-events-none"
            style={{
              background: `linear-gradient(45deg, ${property.color}, transparent, ${property.color})`,
              backgroundSize: '200% 200%',
              opacity: 0,
              zIndex: -1,
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              backgroundPosition: ['0% 50%', '200% 50%', '0% 50%'],
            }}
            transition={{
              opacity: { duration: 0.3 },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
          />
        )}
        
        {/* Property content organized for better visibility */}
        <div className="w-full h-full flex flex-col relative">
          {/* Color stripe at top */}
          <div className="w-full h-5 flex-shrink-0"
               style={{
                 backgroundColor: property.color,
                 boxShadow: `0 2px 4px ${property.color}80, inset 0 1px 2px rgba(255,255,255,0.3)`,
               }}
          />
          
          {/* Main content area */}
          <div className="flex-1 p-1.5 flex flex-col justify-center items-center text-center">
            {/* Property name - HIGHLY visible */}
            <div className="text-white font-black mb-1"
                 style={{
                   fontSize: orientation === 'horizontal' ? '11px' : '10px',
                   textShadow: '2px 2px 4px rgba(0,0,0,1), 0 0 10px rgba(0,0,0,0.9)',
                   letterSpacing: '0.3px',
                   lineHeight: '1.1',
                   textTransform: 'uppercase',
                 }}>
              {property.name}
            </div>
            
            {/* Price */}
            <div className="text-yellow-400 font-bold"
                 style={{
                   fontSize: '10px',
                   textShadow: '1px 1px 3px rgba(0,0,0,0.9)',
                 }}>
              ${property.price}
            </div>
          </div>

          {/* Enhanced ownership indicator */}
          {isOwned && owner && (
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-lg"
                 style={{ backgroundColor: owner.color }}>
              {owner.name[0]}
            </div>
          )}

          {/* Better house/hotel display */}
          {property.houses > 0 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {[...Array(Math.min(property.houses, 4))].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-sm border border-white/50 flex items-center justify-center text-xs font-bold text-white"
                     style={{ backgroundColor: property.color }}>
                  🏠
                </div>
              ))}
              {property.houses === 5 && (
                <div className="w-5 h-5 rounded border border-white/50 flex items-center justify-center text-xs font-bold text-white"
                     style={{ backgroundColor: '#dc2626' }}>
                  🏨
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Player tokens - larger and more visible */}
        {playersHere.length > 0 && (
          <div className="absolute bottom-2 right-2 flex gap-1 flex-wrap">
            {playersHere.map((p, idx) => (
              <motion.div
                key={p.id}
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-white shadow-md"
                style={{ backgroundColor: p.color }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {p.avatar || '👤'}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  // Standard Monopoly layout: 40 spaces (0-39)
  // Bottom: 0, 1-9, 10 (GO to Jail) - displayed right to left (9 to 1)
  // Right: 11-19, 20 (Free Parking) - displayed bottom to top
  // Top: 21-29, 30 (Go to Jail) - displayed left to right
  // Left: 31-39, back to 0 (GO) - displayed top to bottom (39 to 31)
  
  const bottomSpaces = [9, 8, 7, 6, 5, 4, 3, 2, 1].map(pos => getSpaceAtPosition(pos));
  const rightSpaces = [11, 12, 13, 14, 15, 16, 17, 18, 19].map(pos => getSpaceAtPosition(pos));
  const topSpaces = [21, 22, 23, 24, 25, 26, 27, 28, 29].map(pos => getSpaceAtPosition(pos));
  const leftSpaces = [31, 32, 33, 34, 35, 36, 37, 38, 39].map(pos => getSpaceAtPosition(pos)); // Bottom to top for left (after rotation)

  return (
    <motion.div 
      ref={boardRef}
      className="w-full mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Animated border glow */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6)',
          backgroundSize: '400% 400%',
          opacity: 0.3,
          filter: 'blur(40px)',
        }}
      />
      
      <div 
        className="relative rounded-2xl overflow-visible game-board board-border bg-gradient-to-br from-gray-800 via-slate-800 to-gray-800 border-4 border-cyan-500 shadow-2xl shadow-cyan-500/20"
        style={{
          position: 'relative',
          padding: '1.5vmin',
          minHeight: 'fit-content',
          width: 'min(95vh, 95vw, 2000px)',
          height: 'min(95vh, 95vw, 2000px)',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        {/* Animated gradient orbs in background */}
        <motion.div
          className="absolute bg-orb orb-1"
          style={{
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #4FD1C5 0%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.3,
            top: '-200px',
            left: '-200px',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bg-orb orb-2"
          style={{
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #68D391 0%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.3,
            bottom: '-250px',
            right: '-250px',
          }}
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
        />
        <motion.div
          className="absolute bg-orb orb-3"
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, #B794F4 0%, transparent 70%)',
            filter: 'blur(80px)',
            opacity: 0.3,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 10,
          }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 board-grid pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(79, 209, 197, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(79, 209, 197, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            opacity: 0.3,
          }}
        />
        
        {/* Vignette effect */}
        <div 
          className="absolute inset-0 board-vignette pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 100%)',
          }}
        />
        
        {/* Noise texture for depth */}
        <div 
          className="absolute inset-0 board-noise pointer-events-none opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Animated border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            border: '4px solid transparent',
            borderImage: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 25%, #68D391 50%, #4FD1C5 75%, #38B2AC 100%) 1',
          }}
          animate={{
            boxShadow: [
              '0 0 40px rgba(79, 209, 197, 0.3), inset 0 0 40px rgba(79, 209, 197, 0.1)',
              '0 0 60px rgba(79, 209, 197, 0.5), inset 0 0 60px rgba(79, 209, 197, 0.2)',
              '0 0 40px rgba(79, 209, 197, 0.3), inset 0 0 40px rgba(79, 209, 197, 0.1)',
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Responsive Square Board */}
        <div 
          className="relative codeopoly-board-container"
          style={{
            width: '100%',
            height: '100%',
            aspectRatio: '1 / 1',
            margin: '0 auto',
            overflow: 'visible',
            padding: '0.5rem',
          }}
        >
      {/* Board Grid Container - Perfect 11x11 Square Grid - Enlarged */}
      <div 
        className="relative codeopoly-board-grid"
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(11, 1fr)',
          gridTemplateRows: 'repeat(11, 1fr)',
          gap: '10px',
        }}
      >
        {/* Top-Left Corner: Free Parking (20) */}
        <div style={{ gridArea: '1 / 1 / 2 / 2' }}>
          {renderCornerSpace(getSpaceAtPosition(20), 'h-full w-full', '🅿️')}
        </div>
        
        {/* Top Row: Properties (21-29) */}
        {topSpaces.map((prop, idx) => prop && (
          <div key={prop.id} style={{ gridArea: `1 / ${idx + 2} / 2 / ${idx + 3}` }}>
            {renderProperty(prop, 'horizontal', true)}
          </div>
        ))}
        
        {/* Top-Right Corner: Go to Jail (30) */}
        <div style={{ gridArea: '1 / 11 / 2 / 12' }}>
          {renderCornerSpace(getSpaceAtPosition(30), 'h-full w-full', '🚨')}
        </div>

        {/* Left Column: Properties (39 down to 31) */}
        {leftSpaces.map((prop, idx) => prop && (
          <div key={prop.id} style={{ gridArea: `${idx + 2} / 1 / ${idx + 3} / 2` }}>
            {renderProperty(prop, 'vertical')}
          </div>
        ))}
          
            {/* Center Area - Game State Display */}
            <div
              className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-xl backdrop-blur-sm border-2 border-cyan-500/30 flex flex-col items-center justify-center relative overflow-hidden"
              style={{
                gridArea: '2 / 2 / 11 / 11',
                boxShadow: '0 0 30px rgba(6, 182, 212, 0.2), inset 0 0 30px rgba(6, 182, 212, 0.05)',
              }}
            >
              {/* Current player turn indicator - smaller */}
              <div className="absolute top-2 left-2 right-2 bg-slate-900/80 rounded-lg p-2 border border-emerald-400/30">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                       style={{ backgroundColor: currentPlayer?.color }}>
                    {currentPlayer?.avatar || '👤'}
                  </div>
                  <div className="text-center">
                    <div className="text-emerald-300 font-bold text-xs">CURRENT TURN</div>
                    <div className="text-white font-semibold text-sm">{currentPlayer?.name || 'Waiting...'}</div>
                  </div>
                </div>
              </div>

              {/* Recent game events - smaller */}
              <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 rounded-lg p-2 border border-blue-400/30 max-h-16 overflow-y-auto">
                <div className="text-blue-300 font-bold text-xs mb-1">RECENT EVENTS</div>
                <div className="space-y-1">
                  {gameEvents?.slice(0, 3).map((event, idx) => (
                    <div key={idx} className="text-xs text-white/80 flex items-center gap-1.5">
                      <span style={{ fontSize: '10px' }}>{event.type === 'dice' ? '🎲' : event.type === 'purchase' ? '🏦' : event.type === 'rent' ? '💸' : event.type === 'duel' ? '⚔️' : '⭐'}</span>
                      <span className="truncate" style={{ fontSize: '10px' }}>{event.message}</span>
                    </div>
                  )) || []}
                </div>
              </div>

              {/* CODEOPOLY logo and branding - optimized size */}
              <div className="text-center z-10 relative flex flex-col items-center justify-center">
                <motion.h1
                  className="logo-text font-black font-mono relative"
                  style={{
                    fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                    background: 'linear-gradient(135deg, #4FD1C5 0%, #38B2AC 20%, #68D391 40%, #4FD1C5 60%, #38B2AC 80%, #68D391 100%)',
                    backgroundSize: '300% 300%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter: 'drop-shadow(0 4px 20px rgba(79, 209, 197, 0.6))',
                    letterSpacing: '2px',
                  }}
                >
                  CODEOPOLY
                </motion.h1>

                <motion.p
                  className="tagline text-emerald-400 font-mono relative mt-1"
                  style={{
                    fontSize: 'clamp(0.5rem, 1.2vw, 0.75rem)',
                    letterSpacing: '1px',
                    fontWeight: 300,
                  }}
                >
                  Where Code Meets Capitalism
                </motion.p>
              </div>
            </div>

        {/* Right Column: Properties (11-19) */}
        {rightSpaces.map((prop, idx) => prop && (
          <div key={prop.id} style={{ gridArea: `${idx + 2} / 11 / ${idx + 3} / 12` }}>
            {renderProperty(prop, 'vertical')}
          </div>
        ))}

        {/* Bottom-Left Corner: Jail (10) */}
        <div style={{ gridArea: '11 / 1 / 12 / 2' }}>
          {renderCornerSpace(getSpaceAtPosition(10), 'h-full w-full', '🔒')}
        </div>
        
        {/* Bottom Row: Properties (9 down to 1) */}
        {bottomSpaces.map((prop, idx) => prop && (
          <div key={prop.id} style={{ gridArea: `11 / ${idx + 2} / 12 / ${idx + 3}` }}>
            {renderProperty(prop, 'horizontal')}
          </div>
        ))}
        
        {/* Bottom-Right Corner: GO (0) */}
        <div style={{ gridArea: '11 / 11 / 12 / 12' }}>
          {renderCornerSpace(getSpaceAtPosition(0), 'h-full w-full', '➡️')}
        </div>
      </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * CodeOpoly Tiles System
 * Defines the game board and all tile types
 */

const TILE_TYPES = {
  START: 'START',
  PROPERTY: 'PROPERTY',
  CODE_DUEL: 'CODE_DUEL',
  SYSTEM_CRASH: 'SYSTEM_CRASH',
  CODE_REVIEW: 'CODE_REVIEW',
  HACKATHON: 'HACKATHON'
};

const PROPERTY_GROUPS = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  DATABASE: 'database',
  DEVOPS: 'devops',
  AI_ML: 'ai_ml',
  MOBILE: 'mobile',
  SECURITY: 'security',
  ALGORITHMS: 'algorithms'
};

function createBoard() {
  const board = [
    // Start
    {
      id: 0,
      position: 0,
      type: TILE_TYPES.START,
      name: 'START',
      description: 'Collect $200 when you pass!'
    },
    
    // Side 1 - Frontend Properties
    {
      id: 1,
      position: 1,
      type: TILE_TYPES.PROPERTY,
      name: 'HTML Heights',
      group: PROPERTY_GROUPS.FRONTEND,
      price: 100,
      difficulty: 'easy',
      owner: null
    },
    {
      id: 2,
      position: 2,
      type: TILE_TYPES.CODE_REVIEW,
      name: 'Code Review',
      description: 'Random event!'
    },
    {
      id: 3,
      position: 3,
      type: TILE_TYPES.PROPERTY,
      name: 'CSS Central',
      group: PROPERTY_GROUPS.FRONTEND,
      price: 120,
      difficulty: 'easy',
      owner: null
    },
    {
      id: 4,
      position: 4,
      type: TILE_TYPES.PROPERTY,
      name: 'JavaScript Junction',
      group: PROPERTY_GROUPS.FRONTEND,
      price: 140,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 5,
      position: 5,
      type: TILE_TYPES.SYSTEM_CRASH,
      name: 'System Crash',
      description: 'Debug and miss next turn!'
    },
    
    // Side 2 - Backend Properties
    {
      id: 6,
      position: 6,
      type: TILE_TYPES.PROPERTY,
      name: 'Node.js Avenue',
      group: PROPERTY_GROUPS.BACKEND,
      price: 180,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 7,
      position: 7,
      type: TILE_TYPES.HACKATHON,
      name: 'Hackathon',
      description: 'Team competition!'
    },
    {
      id: 8,
      position: 8,
      type: TILE_TYPES.PROPERTY,
      name: 'Python Plaza',
      group: PROPERTY_GROUPS.BACKEND,
      price: 200,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 9,
      position: 9,
      type: TILE_TYPES.PROPERTY,
      name: 'Java Gardens',
      group: PROPERTY_GROUPS.BACKEND,
      price: 220,
      difficulty: 'hard',
      owner: null
    },
    {
      id: 10,
      position: 10,
      type: TILE_TYPES.CODE_DUEL,
      name: 'Code Duel Arena',
      description: 'Challenge another player!'
    },
    
    // Side 3 - Database & DevOps
    {
      id: 11,
      position: 11,
      type: TILE_TYPES.PROPERTY,
      name: 'MySQL Manor',
      group: PROPERTY_GROUPS.DATABASE,
      price: 260,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 12,
      position: 12,
      type: TILE_TYPES.CODE_REVIEW,
      name: 'Code Review',
      description: 'Random event!'
    },
    {
      id: 13,
      position: 13,
      type: TILE_TYPES.PROPERTY,
      name: 'MongoDB Mile',
      group: PROPERTY_GROUPS.DATABASE,
      price: 280,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 14,
      position: 14,
      type: TILE_TYPES.PROPERTY,
      name: 'Docker District',
      group: PROPERTY_GROUPS.DEVOPS,
      price: 300,
      difficulty: 'hard',
      owner: null
    },
    {
      id: 15,
      position: 15,
      type: TILE_TYPES.SYSTEM_CRASH,
      name: 'System Crash',
      description: 'Debug and miss next turn!'
    },
    
    // Side 4 - Advanced Tech
    {
      id: 16,
      position: 16,
      type: TILE_TYPES.PROPERTY,
      name: 'Kubernetes Kingdom',
      group: PROPERTY_GROUPS.DEVOPS,
      price: 320,
      difficulty: 'hard',
      owner: null
    },
    {
      id: 17,
      position: 17,
      type: TILE_TYPES.HACKATHON,
      name: 'Hackathon',
      description: 'Team competition!'
    },
    {
      id: 18,
      position: 18,
      type: TILE_TYPES.PROPERTY,
      name: 'AI Algorithm Alley',
      group: PROPERTY_GROUPS.AI_ML,
      price: 350,
      difficulty: 'hard',
      owner: null
    },
    {
      id: 19,
      position: 19,
      type: TILE_TYPES.PROPERTY,
      name: 'Machine Learning Meadows',
      group: PROPERTY_GROUPS.AI_ML,
      price: 400,
      difficulty: 'hard',
      owner: null
    },
    {
      id: 20,
      position: 20,
      type: TILE_TYPES.CODE_DUEL,
      name: 'Code Duel Arena',
      description: 'Challenge another player!'
    },
    
    // Additional properties to make a proper board
    {
      id: 21,
      position: 21,
      type: TILE_TYPES.PROPERTY,
      name: 'React Ridge',
      group: PROPERTY_GROUPS.FRONTEND,
      price: 160,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 22,
      position: 22,
      type: TILE_TYPES.CODE_REVIEW,
      name: 'Code Review',
      description: 'Random event!'
    },
    {
      id: 23,
      position: 23,
      type: TILE_TYPES.PROPERTY,
      name: 'API Gateway',
      group: PROPERTY_GROUPS.BACKEND,
      price: 240,
      difficulty: 'medium',
      owner: null
    },
    {
      id: 24,
      position: 24,
      type: TILE_TYPES.PROPERTY,
      name: 'Security Suite',
      group: PROPERTY_GROUPS.SECURITY,
      price: 500,
      difficulty: 'hard',
      owner: null
    }
  ];
  
  return board;
}

export {
  createBoard,
  TILE_TYPES,
  PROPERTY_GROUPS
};

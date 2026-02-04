import { Die } from './dice';

// Game phases
export type GamePhase = 'lobby' | 'rolling' | 'selecting' | 'marking' | 'passive_turn' | 'game_over';

// Player identifiers
export type PlayerId = 'player1' | 'player2';

// Player information
export interface Player {
  name: string;
  sessionId: string; // Firebase anonymous auth UID
  isConnected: boolean;
}

// Yellow section: 4x4 grid, cross off cells matching die value
// Grid positions correspond to specific die values
export interface YellowSection {
  grid: boolean[][]; // 4x4 grid of crossed-off cells
  score: number;
}

// Blue section: Cross off cells matching blue+white sum (2-12)
// Fixed pattern of values 2-12
export interface BlueSection {
  cells: boolean[]; // 11 cells representing sums 2-12
  score: number;
}

// Green section: Sequential cells with minimum thresholds
// Each cell must have value >= threshold
export interface GreenSection {
  values: (number | null)[]; // 11 cells, null = not filled
  score: number;
}

// Orange section: Write die values, some cells have 2x/3x multipliers
export interface OrangeSection {
  values: (number | null)[]; // 11 cells
  score: number;
}

// Purple section: Each value must be higher than previous (or start fresh after 6)
export interface PurpleSection {
  values: (number | null)[]; // 11 cells
  score: number;
}

// Bonus items available to players
export interface Bonuses {
  rerolls: number; // Number of rerolls available
  plusOnes: number; // +1 modifiers available
  extraDice: { // Extra dice from crossing rows/columns
    yellow: boolean;
    blue: boolean;
    green: boolean;
    orange: boolean;
    purple: boolean;
  };
  foxes: number; // Number of fox bonuses earned
}

// Complete scorecard for a player
export interface Scorecard {
  yellow: YellowSection;
  blue: BlueSection;
  green: GreenSection;
  orange: OrangeSection;
  purple: PurpleSection;
  bonuses: Bonuses;
  totalScore: number;
}

// Dice state in a game
export interface DiceState {
  dice: Die[];
  rollNumber: 1 | 2 | 3;
  silverTray: Die[];
  selectedDice: Die[];
}

// Complete game state stored in Firebase
export interface GameState {
  roomCode: string;
  phase: GamePhase;
  currentRound: number; // 1-6
  activePlayerId: PlayerId;
  players: {
    player1: Player | null;
    player2: Player | null;
  };
  diceState: DiceState;
  scorecards: {
    player1: Scorecard;
    player2: Scorecard;
  };
  createdAt: number;
  lastUpdatedAt: number;
}

// Initial empty scorecard
export const createInitialScorecard = (): Scorecard => ({
  yellow: {
    grid: [
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
      [false, false, false, false],
    ],
    score: 0,
  },
  blue: {
    cells: Array(11).fill(false),
    score: 0,
  },
  green: {
    values: Array(11).fill(null),
    score: 0,
  },
  orange: {
    values: Array(11).fill(null),
    score: 0,
  },
  purple: {
    values: Array(11).fill(null),
    score: 0,
  },
  bonuses: {
    rerolls: 0,
    plusOnes: 0,
    extraDice: {
      yellow: false,
      blue: false,
      green: false,
      orange: false,
      purple: false,
    },
    foxes: 0,
  },
  totalScore: 0,
});

// Initial dice state
export const createInitialDiceState = (): DiceState => ({
  dice: [],
  rollNumber: 1,
  silverTray: [],
  selectedDice: [],
});

// Create initial game state
export const createInitialGameState = (roomCode: string): Omit<GameState, 'players'> & { players: { player1: null; player2: null } } => ({
  roomCode,
  phase: 'lobby',
  currentRound: 1,
  activePlayerId: 'player1',
  players: {
    player1: null,
    player2: null,
  },
  diceState: createInitialDiceState(),
  scorecards: {
    player1: createInitialScorecard(),
    player2: createInitialScorecard(),
  },
  createdAt: Date.now(),
  lastUpdatedAt: Date.now(),
});

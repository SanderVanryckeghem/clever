// Ganz Schön Clever Scorecard Constants

// ==================== YELLOW SECTION ====================
// 4x4 grid where each cell can only be crossed off with a specific die value
// The values represent what die value is needed to cross off each cell
export const YELLOW_GRID_VALUES: number[][] = [
  [3, 6, 5, 0], // Row 0: 0 indicates a blank/bonus cell
  [2, 1, 0, 5],
  [1, 0, 2, 4],
  [0, 3, 4, 6],
];

// Points for completing rows in yellow
export const YELLOW_ROW_SCORES = [10, 14, 16, 20];

// Points for completing columns in yellow
export const YELLOW_COLUMN_SCORES = [10, 14, 16, 20];

// Points for completing diagonals
export const YELLOW_DIAGONAL_SCORE = 0; // Diagonal gives bonus dice, not points

// ==================== BLUE SECTION ====================
// Blue section uses the sum of blue die + white die (2-12)
// The grid shows which cells correspond to which sums
export const BLUE_CELL_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Points for number of cells crossed off in blue
// Index = number of cells crossed, value = points
export const BLUE_SCORING = [0, 1, 2, 4, 6, 9, 12, 16, 20, 24, 28, 32];

// ==================== GREEN SECTION ====================
// Each cell has a minimum value threshold (>=)
// First cell is free (any value), subsequent cells must be >= threshold
export const GREEN_THRESHOLDS = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6];

// Points for number of cells filled in green (triangular numbers)
export const GREEN_SCORING = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];

// ==================== ORANGE SECTION ====================
// Orange cells - some have multipliers (2x or 3x)
// Multiplier positions: index -> multiplier (1 = no multiplier)
export const ORANGE_MULTIPLIERS = [1, 1, 2, 1, 1, 1, 2, 1, 2, 3, 1];

// Orange scoring is sum of all values * their multipliers
// No lookup table needed, calculated dynamically

// ==================== PURPLE SECTION ====================
// Each value must be higher than the previous one
// Exception: After a 6, you can start fresh with any value
// Scoring is sum of all values

// Valid next values given the current value
export const PURPLE_VALID_NEXT = (currentValue: number | null): number[] => {
  if (currentValue === null) return [1, 2, 3, 4, 5, 6];
  if (currentValue === 6) return [1, 2, 3, 4, 5, 6]; // Reset after 6
  return Array.from({ length: 6 - currentValue }, (_, i) => currentValue + 1 + i);
};

// ==================== BONUSES ====================
// Bonus positions in each section
export const BONUS_POSITIONS = {
  yellow: {
    // Completing specific cells gives bonuses
    reroll: [{ row: 0, col: 3 }, { row: 1, col: 2 }],
    plusOne: [{ row: 2, col: 1 }, { row: 3, col: 0 }],
    extraDice: {
      blue: [{ row: 0, col: 3 }], // Crossing this cell in yellow unlocks extra blue die
      green: [{ row: 1, col: 2 }],
      orange: [{ row: 2, col: 1 }],
      purple: [{ row: 3, col: 0 }],
    },
    fox: [], // Yellow has no fox
  },
  blue: {
    // Cells that give bonuses when crossed
    reroll: [3, 7], // 5th and 8th cells (0-indexed positions 4 and 7)
    plusOne: [5, 9],
    extraDice: {
      green: [4],
      orange: [8],
    },
    fox: [10], // Last cell gives fox
  },
  green: {
    // Cells that give bonuses when filled
    reroll: [2, 6],
    plusOne: [4, 8],
    extraDice: {
      purple: [5],
      blue: [9],
    },
    fox: [10],
  },
  orange: {
    // Cells that give bonuses
    reroll: [3, 7],
    plusOne: [5],
    extraDice: {
      yellow: [9],
    },
    fox: [10],
  },
  purple: {
    // Cells that give bonuses
    reroll: [2, 6],
    plusOne: [4, 8],
    extraDice: {},
    fox: [10],
  },
};

// Total rounds in a game
export const TOTAL_ROUNDS = 6;

// Maximum selections per turn for active player
export const MAX_SELECTIONS_ACTIVE = 3;

// Selections for passive player (from silver tray)
export const MAX_SELECTIONS_PASSIVE = 1;

// Maximum roll attempts per turn
export const MAX_ROLLS = 3;

// Score calculation helpers
export const calculateYellowScore = (grid: boolean[][]): number => {
  let score = 0;

  // Row scores
  for (let row = 0; row < 4; row++) {
    if (grid[row].every(cell => cell)) {
      score += YELLOW_ROW_SCORES[row];
    }
  }

  // Column scores
  for (let col = 0; col < 4; col++) {
    if (grid.every(row => row[col])) {
      score += YELLOW_COLUMN_SCORES[col];
    }
  }

  return score;
};

export const calculateBlueScore = (cells: boolean[]): number => {
  const filledCount = cells.filter(Boolean).length;
  return BLUE_SCORING[filledCount] ?? 0;
};

export const calculateGreenScore = (values: (number | null)[]): number => {
  const filledCount = values.filter(v => v !== null).length;
  return GREEN_SCORING[filledCount] ?? 0;
};

export const calculateOrangeScore = (values: (number | null)[]): number => {
  return values.reduce<number>((sum, value, index) => {
    if (value === null) return sum;
    return sum + value * ORANGE_MULTIPLIERS[index];
  }, 0);
};

export const calculatePurpleScore = (values: (number | null)[]): number => {
  return values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
};

// Calculate total score including fox bonuses
export const calculateTotalScore = (
  yellowScore: number,
  blueScore: number,
  greenScore: number,
  orangeScore: number,
  purpleScore: number,
  foxCount: number
): number => {
  const sectionScores = [yellowScore, blueScore, greenScore, orangeScore, purpleScore];
  const lowestScore = Math.min(...sectionScores);
  const foxBonus = lowestScore * foxCount;

  return yellowScore + blueScore + greenScore + orangeScore + purpleScore + foxBonus;
};

// Validation functions
export const canMarkYellow = (
  grid: boolean[][],
  row: number,
  col: number,
  dieValue: number
): boolean => {
  if (grid[row][col]) return false; // Already crossed
  const requiredValue = YELLOW_GRID_VALUES[row][col];
  if (requiredValue === 0) return false; // Bonus cell, not directly markable
  return dieValue === requiredValue;
};

export const canMarkBlue = (
  cells: boolean[],
  position: number,
  blueValue: number,
  whiteValue: number
): boolean => {
  if (cells[position]) return false; // Already crossed
  const sum = blueValue + whiteValue;
  return sum === BLUE_CELL_VALUES[position];
};

export const canMarkGreen = (
  values: (number | null)[],
  position: number,
  dieValue: number
): boolean => {
  // Must fill sequentially
  if (position > 0 && values[position - 1] === null) return false;
  if (values[position] !== null) return false; // Already filled
  return dieValue >= GREEN_THRESHOLDS[position];
};

export const canMarkOrange = (
  values: (number | null)[],
  position: number,
  dieValue: number
): boolean => {
  // Must fill sequentially
  if (position > 0 && values[position - 1] === null) return false;
  if (values[position] !== null) return false; // Already filled
  return true; // Any value is valid for orange
};

export const canMarkPurple = (
  values: (number | null)[],
  position: number,
  dieValue: number
): boolean => {
  // Must fill sequentially
  if (position > 0 && values[position - 1] === null) return false;
  if (values[position] !== null) return false; // Already filled

  // Check if value is valid (higher than previous, or any after a 6)
  if (position === 0) return true;
  const previousValue = values[position - 1];
  if (previousValue === null) return false;
  if (previousValue === 6) return true; // Reset after 6
  return dieValue > previousValue;
};

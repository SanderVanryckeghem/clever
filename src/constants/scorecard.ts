// Ganz Schön Clever Scorecard Constants
// Based on exact layout from official scorecard image

// ==================== YELLOW SECTION ====================
// 4x4 grid where each cell can only be crossed off with a specific die value
// The values represent what die value is needed to cross off each cell
// 0 = diagonal star cell (bonus cell, not directly markable with dice)
export const YELLOW_GRID_VALUES: number[][] = [
  [3, 6, 5, 0], // Row 0: 3, 6, 5, ⭐
  [2, 1, 0, 5], // Row 1: 2, 1, ⭐, 5
  [1, 0, 2, 4], // Row 2: 1, ⭐, 2, 4
  [0, 3, 4, 6], // Row 3: ⭐, 3, 4, 6
];

// Points for completing rows in yellow
export const YELLOW_ROW_SCORES = [10, 14, 16, 20];

// Points for completing columns in yellow
export const YELLOW_COLUMN_SCORES = [10, 14, 16, 20];

// Row completion bonuses in yellow (right side of each row - from screenshot)
export const YELLOW_ROW_BONUSES = [
  { type: 'blue' },                 // Row 0 complete -> mark any blue cell
  { type: 'orange_and_reroll' },    // Row 1 complete -> mark next orange AND earn reroll
  { type: 'green' },                // Row 2 complete -> mark next green
  { type: 'fox' },                  // Row 3 complete -> earn fox
];

// Column completion bonuses in yellow (bottom of each column - from screenshot)
export const YELLOW_COLUMN_BONUSES = [
  { type: 'plusOne' },              // Col 0 complete -> earn +1
  { type: 'blue' },                 // Col 1 complete -> mark any blue cell
  { type: 'reroll' },               // Col 2 complete -> earn reroll
  { type: 'purple' },               // Col 3 complete -> mark next purple
];

// Diagonal bonus (completing all 4 star cells)
export const YELLOW_DIAGONAL_BONUS = { type: 'extraDie', color: 'yellow' };

// ==================== BLUE SECTION ====================
// Blue section uses the sum of blue die + white die (2-12)
// From the screenshot, the layout is irregular - shown as a connected grid
// Row 0: 2, 3, 4 (with bonus icons above: numbers 1-9 are point markers)
// Row 1: 5, 6, 7, 8
// Row 2: 9, 10, 11, 12
export const BLUE_GRID_VALUES: number[][] = [
  [2, 3, 4, 0],     // Row 0: 2, 3, 4 (no 4th cell in this row)
  [5, 6, 7, 8],     // Row 1: 5, 6, 7, 8
  [9, 10, 11, 12],  // Row 2: 9, 10, 11, 12
];

// For backwards compatibility and easier lookup
export const BLUE_CELL_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Points for number of cells crossed off in blue (from scoring track at top)
// Index = number of cells crossed, value = points
export const BLUE_SCORING = [0, 1, 2, 4, 6, 9, 12, 16, 20, 24, 28, 32];

// Row completion bonuses in blue (right side of each row - from screenshot)
export const BLUE_ROW_BONUSES = [
  { type: 'orange' },               // Row 0 complete -> mark next orange
  { type: 'yellow' },               // Row 1 complete -> mark any yellow
  { type: 'fox' },                  // Row 2 complete -> earn fox
];

// Column completion bonuses in blue (bottom of each column - from screenshot)
export const BLUE_COLUMN_BONUSES = [
  { type: 'reroll' },               // Col 0 complete -> earn reroll
  { type: 'green' },                // Col 1 complete -> mark next green
  { type: 'purple' },               // Col 2 complete -> mark next purple
  { type: 'plusOne' },              // Col 3 complete -> earn +1
];

// ==================== GREEN SECTION ====================
// Each cell has a minimum value threshold (>=)
// Fill sequentially from left to right
// Green uses X marks - cross off cells when die value >= threshold
// From screenshot: thresholds are ≥1, ≥2, ≥3, ≥4, ≥5, ≥1, ≥2, ≥3, ≥4, ≥5, ≥6
export const GREEN_THRESHOLDS = [1, 2, 3, 4, 5, 1, 2, 3, 4, 5, 6];

// Points for number of cells filled in green (shown below cells in screenshot)
export const GREEN_SCORING = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45, 55, 66];

// Bonuses at specific positions in green (from screenshot - icons below cells)
// Position index (0-based) -> bonus earned when that cell is crossed
export const GREEN_CELL_BONUSES: { [position: number]: { type: string; value?: any } } = {
  2: { type: 'plusOne' },           // Cell 3 (index 2) -> earn +1
  4: { type: 'blue' },              // Cell 5 (index 4) -> mark any blue cell
  5: { type: 'fox' },               // Cell 6 (index 5) -> earn fox
  6: { type: 'purple' },            // Cell 7 (index 6) -> mark next purple
  8: { type: 'reroll' },            // Cell 9 (index 8) -> earn reroll
  10: { type: 'green' },            // Cell 11 (index 10) -> mark next green (chain bonus)
};

// ==================== ORANGE SECTION ====================
// Orange cells - write die values, some cells have multipliers (2x or 3x)
// Fill sequentially from left to right
// From screenshot: multipliers visible at cells 3, 6, 9 (2x) and cell 11 (3x)
export const ORANGE_MULTIPLIERS = [1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 3];

// Orange scoring is sum of all values * their multipliers
// Calculated dynamically

// Bonuses at specific positions in orange (from screenshot - icons below cells)
// Position index (0-based) -> bonus earned when that cell is filled
export const ORANGE_CELL_BONUSES: { [position: number]: { type: string; value?: any } } = {
  2: { type: 'reroll' },            // Cell 3 (index 2, 2x) -> earn reroll
  3: { type: 'yellow' },            // Cell 4 (index 3) -> mark any yellow cell
  5: { type: 'plusOne' },           // Cell 6 (index 5, 2x) -> earn +1
  6: { type: 'plusOne' },           // Cell 7 (index 6) -> earn +1
  8: { type: 'purple' },            // Cell 9 (index 8, 2x) -> mark next purple
  9: { type: 'fox' },               // Cell 10 (index 9) -> earn fox
};

// ==================== PURPLE SECTION ====================
// Each value must be higher than the previous one
// Exception: After a 6, you can start fresh with any value
// Scoring is sum of all values
// Fill sequentially from left to right

// Valid next values given the current value
export const PURPLE_VALID_NEXT = (currentValue: number | null): number[] => {
  if (currentValue === null) return [1, 2, 3, 4, 5, 6];
  if (currentValue === 6) return [1, 2, 3, 4, 5, 6]; // Reset after 6
  return Array.from({ length: 6 - currentValue }, (_, i) => currentValue + 1 + i);
};

// Bonuses at specific positions in purple (from screenshot - icons below cells)
// Position index (0-based) -> bonus earned when that cell is filled
export const PURPLE_CELL_BONUSES: { [position: number]: { type: string; value?: any } } = {
  1: { type: 'reroll' },            // Cell 2 (index 1) -> earn reroll
  2: { type: 'blue' },              // Cell 3 (index 2) -> mark any blue cell
  4: { type: 'plusOne' },           // Cell 5 (index 4) -> earn +1
  5: { type: 'yellow' },            // Cell 6 (index 5) -> mark any yellow cell
  7: { type: 'reroll' },            // Cell 8 (index 7) -> earn reroll
  9: { type: 'green' },             // Cell 10 (index 9) -> mark next green
  10: { type: 'fox' },              // Cell 11 (index 10) -> earn fox
};

// ==================== BONUSES ====================
// Note: Section-specific bonuses are now defined in each section above:
// - YELLOW_ROW_BONUSES, YELLOW_COLUMN_BONUSES, YELLOW_DIAGONAL_BONUS
// - BLUE_ROW_BONUSES, BLUE_COLUMN_BONUSES
// - GREEN_CELL_BONUSES
// - ORANGE_CELL_BONUSES
// - PURPLE_CELL_BONUSES

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

export const calculateBlueScore = (grid: boolean[][]): number => {
  // Count all crossed cells in the 3x4 grid (excluding position [2][3] which is 0/empty)
  let filledCount = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (BLUE_GRID_VALUES[row][col] !== 0 && grid[row]?.[col]) {
        filledCount++;
      }
    }
  }
  return BLUE_SCORING[filledCount] ?? 0;
};

export const calculateGreenScore = (cells: boolean[]): number => {
  const filledCount = cells.filter(Boolean).length;
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
  grid: boolean[][],
  row: number,
  col: number,
  blueValue: number,
  whiteValue: number
): boolean => {
  if (grid[row]?.[col]) return false; // Already crossed
  const requiredValue = BLUE_GRID_VALUES[row]?.[col];
  if (requiredValue === 0 || requiredValue === undefined) return false; // Empty cell
  const sum = blueValue + whiteValue;
  return sum === requiredValue;
};

// Helper to find blue grid position for a sum value
export const findBlueGridPosition = (sumValue: number): { row: number; col: number } | null => {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (BLUE_GRID_VALUES[row][col] === sumValue) {
        return { row, col };
      }
    }
  }
  return null;
};

export const canMarkGreen = (
  cells: boolean[],
  position: number,
  dieValue: number
): boolean => {
  // Must fill sequentially
  if (position > 0 && !cells[position - 1]) return false;
  if (cells[position]) return false; // Already crossed
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

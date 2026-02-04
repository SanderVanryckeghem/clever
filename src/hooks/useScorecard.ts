import { useCallback, useMemo } from 'react';
import {
  Scorecard,
  YellowSection,
  BlueSection,
  GreenSection,
  OrangeSection,
  PurpleSection,
  Bonuses,
  createInitialScorecard,
} from '../types/game';
import {
  YELLOW_GRID_VALUES,
  BLUE_GRID_VALUES,
  GREEN_THRESHOLDS,
  ORANGE_MULTIPLIERS,
  YELLOW_ROW_BONUSES,
  YELLOW_COLUMN_BONUSES,
  BLUE_ROW_BONUSES,
  BLUE_COLUMN_BONUSES,
  GREEN_CELL_BONUSES,
  ORANGE_CELL_BONUSES,
  PURPLE_CELL_BONUSES,
  calculateYellowScore,
  calculateBlueScore,
  calculateGreenScore,
  calculateOrangeScore,
  calculatePurpleScore,
  calculateTotalScore,
  canMarkYellow,
  canMarkBlue,
  canMarkGreen,
  canMarkOrange,
  canMarkPurple,
} from '../constants/scorecard';

export type SectionType = 'yellow' | 'blue' | 'green' | 'orange' | 'purple';

interface MarkResult {
  success: boolean;
  newScorecard: Scorecard;
  bonusesEarned: {
    reroll?: boolean;
    plusOne?: boolean;
    extraDice?: SectionType;
    fox?: boolean;
  };
  error?: string;
}

interface UseScorecardReturn {
  // Validation functions
  canMark: (
    scorecard: Scorecard,
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ) => boolean;

  // Get valid positions for a die
  getValidPositions: (
    scorecard: Scorecard,
    section: SectionType,
    dieValue: number,
    whiteValue?: number
  ) => (number | { row: number; col: number })[];

  // Mark a position on the scorecard
  markPosition: (
    scorecard: Scorecard,
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ) => MarkResult;

  // Recalculate all scores
  recalculateScores: (scorecard: Scorecard) => Scorecard;

  // Get next valid position in sequential sections
  getNextPosition: (scorecard: Scorecard, section: 'green' | 'orange' | 'purple') => number | null;
}

export const useScorecard = (): UseScorecardReturn => {
  // Check if a position can be marked
  const canMark = useCallback((
    scorecard: Scorecard,
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ): boolean => {
    switch (section) {
      case 'yellow': {
        if (typeof position !== 'object') return false;
        return canMarkYellow(scorecard.yellow.grid, position.row, position.col, dieValue);
      }
      case 'blue': {
        // Blue now uses grid position { row, col }
        if (typeof position !== 'object' || whiteValue === undefined) return false;
        return canMarkBlue(scorecard.blue.grid, position.row, position.col, dieValue, whiteValue);
      }
      case 'green': {
        // Green now uses boolean cells (X marks)
        if (typeof position !== 'number') return false;
        return canMarkGreen(scorecard.green.cells, position, dieValue);
      }
      case 'orange': {
        if (typeof position !== 'number') return false;
        return canMarkOrange(scorecard.orange.values, position, dieValue);
      }
      case 'purple': {
        if (typeof position !== 'number') return false;
        return canMarkPurple(scorecard.purple.values, position, dieValue);
      }
      default:
        return false;
    }
  }, []);

  // Get all valid positions for a die value
  const getValidPositions = useCallback((
    scorecard: Scorecard,
    section: SectionType,
    dieValue: number,
    whiteValue?: number
  ): (number | { row: number; col: number })[] => {
    const validPositions: (number | { row: number; col: number })[] = [];

    switch (section) {
      case 'yellow': {
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            if (canMarkYellow(scorecard.yellow.grid, row, col, dieValue)) {
              validPositions.push({ row, col });
            }
          }
        }
        break;
      }
      case 'blue': {
        // Blue now uses grid - find matching sum positions
        if (whiteValue !== undefined) {
          const sum = dieValue + whiteValue;
          for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
              if (canMarkBlue(scorecard.blue.grid, row, col, dieValue, whiteValue)) {
                validPositions.push({ row, col });
              }
            }
          }
        }
        break;
      }
      case 'green': {
        // Green now uses boolean cells
        for (let i = 0; i < GREEN_THRESHOLDS.length; i++) {
          if (canMarkGreen(scorecard.green.cells, i, dieValue)) {
            validPositions.push(i);
            break; // Only one valid position in sequential sections
          }
        }
        break;
      }
      case 'orange': {
        for (let i = 0; i < ORANGE_MULTIPLIERS.length; i++) {
          if (canMarkOrange(scorecard.orange.values, i, dieValue)) {
            validPositions.push(i);
            break;
          }
        }
        break;
      }
      case 'purple': {
        for (let i = 0; i < scorecard.purple.values.length; i++) {
          if (canMarkPurple(scorecard.purple.values, i, dieValue)) {
            validPositions.push(i);
            break;
          }
        }
        break;
      }
    }

    return validPositions;
  }, []);

  // Get next position for sequential sections
  const getNextPosition = useCallback((
    scorecard: Scorecard,
    section: 'green' | 'orange' | 'purple'
  ): number | null => {
    if (section === 'green') {
      // Green uses boolean cells
      const nextIndex = scorecard.green.cells.findIndex(c => !c);
      return nextIndex === -1 ? null : nextIndex;
    }
    // Orange and purple use values
    const values = scorecard[section].values;
    const nextIndex = values.findIndex(v => v === null);
    return nextIndex === -1 ? null : nextIndex;
  }, []);

  // Check for bonuses at a position
  const checkBonuses = useCallback((
    section: SectionType,
    position: number | { row: number; col: number },
    yellowGrid?: boolean[][],
    blueGrid?: boolean[][]
  ): {
    reroll?: boolean;
    plusOne?: boolean;
    extraDice?: SectionType;
    fox?: boolean;
  } => {
    const bonuses: {
      reroll?: boolean;
      plusOne?: boolean;
      extraDice?: SectionType;
      fox?: boolean;
    } = {};

    if (section === 'yellow' && typeof position === 'object' && yellowGrid) {
      const { row, col } = position;

      // Check row completion - bonuses from YELLOW_ROW_BONUSES
      if (yellowGrid[row].every(cell => cell)) {
        const rowBonus = YELLOW_ROW_BONUSES[row];
        if (rowBonus.type === 'reroll') bonuses.reroll = true;
        if (rowBonus.type === 'plusOne') bonuses.plusOne = true;
        if (rowBonus.type === 'fox') bonuses.fox = true;
      }

      // Check column completion - bonuses from YELLOW_COLUMN_BONUSES
      if (yellowGrid.every(r => r[col])) {
        const colBonus = YELLOW_COLUMN_BONUSES[col];
        if (colBonus.type === 'reroll') bonuses.reroll = true;
        if (colBonus.type === 'plusOne') bonuses.plusOne = true;
      }
    } else if (section === 'blue' && typeof position === 'object' && blueGrid) {
      const { row, col } = position;

      // Check row completion in blue
      const rowCells = [0, 1, 2, 3].filter(c => BLUE_GRID_VALUES[row][c] !== 0);
      if (rowCells.every(c => blueGrid[row][c])) {
        const rowBonus = BLUE_ROW_BONUSES[row];
        if (rowBonus.type === 'fox') bonuses.fox = true;
      }

      // Check column completion in blue
      const colCells = [0, 1, 2].filter(r => BLUE_GRID_VALUES[r][col] !== 0);
      if (colCells.every(r => blueGrid[r][col])) {
        const colBonus = BLUE_COLUMN_BONUSES[col];
        if (colBonus.type === 'reroll') bonuses.reroll = true;
        if (colBonus.type === 'plusOne') bonuses.plusOne = true;
      }
    } else if (typeof position === 'number') {
      // Check linear section bonuses
      let cellBonus: { type: string; value?: any } | undefined;

      if (section === 'green') {
        cellBonus = GREEN_CELL_BONUSES[position];
      } else if (section === 'orange') {
        cellBonus = ORANGE_CELL_BONUSES[position];
      } else if (section === 'purple') {
        cellBonus = PURPLE_CELL_BONUSES[position];
      }

      if (cellBonus) {
        if (cellBonus.type === 'reroll') bonuses.reroll = true;
        if (cellBonus.type === 'plusOne') bonuses.plusOne = true;
        if (cellBonus.type === 'fox') bonuses.fox = true;
        // Note: extraDice and cross-section bonuses would need more complex handling
      }
    }

    return bonuses;
  }, []);

  // Mark a position on the scorecard
  const markPosition = useCallback((
    scorecard: Scorecard,
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ): MarkResult => {
    // Validate the move
    if (!canMark(scorecard, section, position, dieValue, whiteValue)) {
      return {
        success: false,
        newScorecard: scorecard,
        bonusesEarned: {},
        error: 'Invalid move',
      };
    }

    // Create a deep copy of the scorecard
    const newScorecard: Scorecard = JSON.parse(JSON.stringify(scorecard));

    switch (section) {
      case 'yellow': {
        if (typeof position !== 'object') break;
        newScorecard.yellow.grid[position.row][position.col] = true;
        newScorecard.yellow.score = calculateYellowScore(newScorecard.yellow.grid);
        break;
      }
      case 'blue': {
        // Blue now uses grid
        if (typeof position !== 'object') break;
        if (!newScorecard.blue.grid[position.row]) {
          newScorecard.blue.grid[position.row] = [false, false, false, false];
        }
        newScorecard.blue.grid[position.row][position.col] = true;
        newScorecard.blue.score = calculateBlueScore(newScorecard.blue.grid);
        break;
      }
      case 'green': {
        // Green now uses boolean cells (X marks)
        if (typeof position !== 'number') break;
        newScorecard.green.cells[position] = true;
        newScorecard.green.score = calculateGreenScore(newScorecard.green.cells);
        break;
      }
      case 'orange': {
        if (typeof position !== 'number') break;
        newScorecard.orange.values[position] = dieValue;
        newScorecard.orange.score = calculateOrangeScore(newScorecard.orange.values);
        break;
      }
      case 'purple': {
        if (typeof position !== 'number') break;
        newScorecard.purple.values[position] = dieValue;
        newScorecard.purple.score = calculatePurpleScore(newScorecard.purple.values);
        break;
      }
    }

    // Check for bonuses
    const bonusesEarned = checkBonuses(
      section,
      position,
      section === 'yellow' ? newScorecard.yellow.grid : undefined,
      section === 'blue' ? newScorecard.blue.grid : undefined
    );

    // Apply bonuses to scorecard
    if (bonusesEarned.reroll) {
      newScorecard.bonuses.rerolls++;
    }
    if (bonusesEarned.plusOne) {
      newScorecard.bonuses.plusOnes++;
    }
    if (bonusesEarned.fox) {
      newScorecard.bonuses.foxes++;
    }
    if (bonusesEarned.extraDice) {
      newScorecard.bonuses.extraDice[bonusesEarned.extraDice] = true;
    }

    // Recalculate total score
    newScorecard.totalScore = calculateTotalScore(
      newScorecard.yellow.score,
      newScorecard.blue.score,
      newScorecard.green.score,
      newScorecard.orange.score,
      newScorecard.purple.score,
      newScorecard.bonuses.foxes
    );

    return {
      success: true,
      newScorecard,
      bonusesEarned,
    };
  }, [canMark, checkBonuses]);

  // Recalculate all scores
  const recalculateScores = useCallback((scorecard: Scorecard): Scorecard => {
    const newScorecard: Scorecard = JSON.parse(JSON.stringify(scorecard));

    newScorecard.yellow.score = calculateYellowScore(newScorecard.yellow.grid);
    newScorecard.blue.score = calculateBlueScore(newScorecard.blue.grid);
    newScorecard.green.score = calculateGreenScore(newScorecard.green.cells);
    newScorecard.orange.score = calculateOrangeScore(newScorecard.orange.values);
    newScorecard.purple.score = calculatePurpleScore(newScorecard.purple.values);

    newScorecard.totalScore = calculateTotalScore(
      newScorecard.yellow.score,
      newScorecard.blue.score,
      newScorecard.green.score,
      newScorecard.orange.score,
      newScorecard.purple.score,
      newScorecard.bonuses.foxes
    );

    return newScorecard;
  }, []);

  return {
    canMark,
    getValidPositions,
    markPosition,
    recalculateScores,
    getNextPosition,
  };
};

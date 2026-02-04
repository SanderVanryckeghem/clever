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
  BLUE_CELL_VALUES,
  GREEN_THRESHOLDS,
  ORANGE_MULTIPLIERS,
  BONUS_POSITIONS,
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
        if (typeof position !== 'number' || whiteValue === undefined) return false;
        return canMarkBlue(scorecard.blue.cells, position, dieValue, whiteValue);
      }
      case 'green': {
        if (typeof position !== 'number') return false;
        return canMarkGreen(scorecard.green.values, position, dieValue);
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
        if (whiteValue !== undefined) {
          for (let i = 0; i < BLUE_CELL_VALUES.length; i++) {
            if (canMarkBlue(scorecard.blue.cells, i, dieValue, whiteValue)) {
              validPositions.push(i);
            }
          }
        }
        break;
      }
      case 'green': {
        for (let i = 0; i < GREEN_THRESHOLDS.length; i++) {
          if (canMarkGreen(scorecard.green.values, i, dieValue)) {
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
    const values = scorecard[section].values;
    const nextIndex = values.findIndex(v => v === null);
    return nextIndex === -1 ? null : nextIndex;
  }, []);

  // Check for bonuses at a position
  const checkBonuses = useCallback((
    section: SectionType,
    position: number | { row: number; col: number },
    grid?: boolean[][]
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

    if (section === 'yellow' && typeof position === 'object') {
      // Check yellow grid bonuses
      const { row, col } = position;

      // Check row completion
      if (grid && grid[row].every(cell => cell)) {
        // Row completed - could trigger bonuses
      }

      // Check column completion
      if (grid && grid.every(r => r[col])) {
        // Column completed - could trigger bonuses
      }
    } else if (typeof position === 'number' && section !== 'yellow') {
      // Check linear section bonuses
      const sectionBonuses = BONUS_POSITIONS[section];

      if (sectionBonuses.reroll.includes(position)) {
        bonuses.reroll = true;
      }
      if (sectionBonuses.plusOne.includes(position)) {
        bonuses.plusOne = true;
      }
      if (sectionBonuses.fox.includes(position)) {
        bonuses.fox = true;
      }
      for (const [diceColor, positions] of Object.entries(sectionBonuses.extraDice)) {
        if ((positions as number[]).includes(position)) {
          bonuses.extraDice = diceColor as SectionType;
        }
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
        if (typeof position !== 'number') break;
        newScorecard.blue.cells[position] = true;
        newScorecard.blue.score = calculateBlueScore(newScorecard.blue.cells);
        break;
      }
      case 'green': {
        if (typeof position !== 'number') break;
        newScorecard.green.values[position] = dieValue;
        newScorecard.green.score = calculateGreenScore(newScorecard.green.values);
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
      section === 'yellow' ? newScorecard.yellow.grid : undefined
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
    newScorecard.blue.score = calculateBlueScore(newScorecard.blue.cells);
    newScorecard.green.score = calculateGreenScore(newScorecard.green.values);
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

import { DiceColor } from '../types/dice';

// All dice colors in the game
export const DICE_COLORS: DiceColor[] = [
  'yellow',
  'blue',
  'green',
  'orange',
  'purple',
  'white',
];

// Visual colors for each die
export const DICE_COLOR_MAP: Record<DiceColor, string> = {
  yellow: '#FFD700',
  blue: '#4169E1',
  green: '#228B22',
  orange: '#FF8C00',
  purple: '#8B008B',
  white: '#F5F5F5',
};

// Text color for dice (for contrast)
export const DICE_TEXT_COLOR_MAP: Record<DiceColor, string> = {
  yellow: '#000000',
  blue: '#FFFFFF',
  green: '#FFFFFF',
  orange: '#000000',
  purple: '#FFFFFF',
  white: '#000000',
};

// Number of rolls per turn for active player
export const ROLLS_PER_TURN = 3;

// Number of dice selections per turn for active player
export const SELECTIONS_PER_TURN = 3;

// Dice values range
export const MIN_DIE_VALUE = 1;
export const MAX_DIE_VALUE = 6;

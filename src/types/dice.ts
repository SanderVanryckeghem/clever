// Dice colors matching the Clever game
export type DiceColor = 'yellow' | 'blue' | 'green' | 'orange' | 'purple' | 'white';

// State of a single die
export interface Die {
  id: string;
  color: DiceColor;
  value: number;
  isOnSilverTray: boolean;
  isSelected: boolean;
}

// Dice selection for a turn (active player can select up to 3 dice)
export interface DiceSelection {
  selectedDice: Die[];
  silverTrayDice: Die[];
  availableDice: Die[];
}

// Roll state during a turn
export interface RollState {
  rollNumber: 1 | 2 | 3;
  dice: Die[];
  selectedThisTurn: Die[];
}

// The result of rolling all available dice
export interface RollResult {
  dice: Die[];
}

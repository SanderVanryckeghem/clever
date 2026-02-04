import { useState, useCallback } from 'react';
import { Die, DiceColor, RollState } from '../types/dice';
import {
  DICE_COLORS,
  ROLLS_PER_TURN,
  SELECTIONS_PER_TURN,
  MIN_DIE_VALUE,
  MAX_DIE_VALUE,
} from '../constants/game';

// Generate a random die value
const rollDieValue = (): number =>
  Math.floor(Math.random() * (MAX_DIE_VALUE - MIN_DIE_VALUE + 1)) + MIN_DIE_VALUE;

// Create initial dice set
const createInitialDice = (): Die[] =>
  DICE_COLORS.map((color) => ({
    id: color,
    color,
    value: rollDieValue(),
    isOnSilverTray: false,
    isSelected: false,
  }));

export interface UseDiceReturn {
  dice: Die[];
  rollNumber: number;
  selectedDice: Die[];
  silverTrayDice: Die[];
  availableDice: Die[];
  canRoll: boolean;
  canSelect: boolean;
  isTurnComplete: boolean;
  rollDice: () => void;
  selectDie: (dieId: string) => void;
  resetTurn: () => void;
}

export const useDice = (): UseDiceReturn => {
  const [rollState, setRollState] = useState<RollState>(() => ({
    rollNumber: 1,
    dice: createInitialDice(),
    selectedThisTurn: [],
  }));

  // Derived state
  const silverTrayDice = rollState.dice.filter((d) => d.isOnSilverTray);
  const selectedDice = rollState.selectedThisTurn;
  const availableDice = rollState.dice.filter(
    (d) => !d.isOnSilverTray && !d.isSelected
  );

  const canRoll = rollState.rollNumber <= ROLLS_PER_TURN && availableDice.length > 0;
  const canSelect = availableDice.length > 0 && selectedDice.length < SELECTIONS_PER_TURN;
  const isTurnComplete = selectedDice.length >= SELECTIONS_PER_TURN || availableDice.length === 0;

  // Roll all available dice
  const rollDice = useCallback(() => {
    if (!canRoll) return;

    setRollState((prev) => ({
      ...prev,
      dice: prev.dice.map((die) =>
        die.isOnSilverTray || die.isSelected
          ? die
          : { ...die, value: rollDieValue() }
      ),
    }));
  }, [canRoll]);

  // Select a die - moves lower value dice to silver tray and re-rolls remaining
  const selectDie = useCallback((dieId: string) => {
    setRollState((prev) => {
      // Block selection if already selected 3 dice
      if (prev.selectedThisTurn.length >= SELECTIONS_PER_TURN) {
        return prev;
      }

      const selectedDie = prev.dice.find((d) => d.id === dieId);
      if (!selectedDie || selectedDie.isOnSilverTray || selectedDie.isSelected) {
        return prev;
      }

      const selectedValue = selectedDie.value;
      const newRollNumber = (prev.rollNumber + 1) as 1 | 2 | 3;

      // Mark die as selected, move lower-value dice to silver tray, and re-roll remaining
      const updatedDice = prev.dice.map((die) => {
        if (die.id === dieId) {
          return { ...die, isSelected: true };
        }
        // Dice already on tray or selected stay as is
        if (die.isOnSilverTray || die.isSelected) {
          return die;
        }
        // Move lower value dice to silver tray
        if (die.value < selectedValue) {
          return { ...die, isOnSilverTray: true };
        }
        // Re-roll remaining available dice (if we haven't used all rolls)
        if (newRollNumber <= ROLLS_PER_TURN) {
          return { ...die, value: rollDieValue() };
        }
        return die;
      });

      const newSelectedDie = updatedDice.find((d) => d.id === dieId)!;

      return {
        rollNumber: newRollNumber,
        dice: updatedDice,
        selectedThisTurn: [...prev.selectedThisTurn, newSelectedDie],
      };
    });
  }, []);

  // Reset for a new turn
  const resetTurn = useCallback(() => {
    setRollState({
      rollNumber: 1,
      dice: createInitialDice(),
      selectedThisTurn: [],
    });
  }, []);

  return {
    dice: rollState.dice,
    rollNumber: rollState.rollNumber,
    selectedDice,
    silverTrayDice,
    availableDice,
    canRoll,
    canSelect,
    isTurnComplete,
    rollDice,
    selectDie,
    resetTurn,
  };
};

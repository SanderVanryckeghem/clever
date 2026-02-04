import { useCallback } from 'react';
import { Die, DiceColor } from '../types/dice';
import { DiceState } from '../types/game';
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
export const createInitialDice = (): Die[] =>
  DICE_COLORS.map((color) => ({
    id: color,
    color: color as DiceColor,
    value: rollDieValue(),
    isOnSilverTray: false,
    isSelected: false,
  }));

export interface UseMultiplayerDiceReturn {
  // State transformations (returns new state, doesn't mutate)
  rollDice: (diceState: DiceState) => DiceState;
  selectDie: (diceState: DiceState, dieId: string) => DiceState;
  selectFromSilverTray: (diceState: DiceState, dieId: string) => { die: Die; newState: DiceState } | null;
  applyPlusOne: (diceState: DiceState, dieId: string) => DiceState;
  resetForNewTurn: () => DiceState;

  // Computed values
  getAvailableDice: (diceState: DiceState) => Die[];
  getSilverTrayDice: (diceState: DiceState) => Die[];
  getSelectedDice: (diceState: DiceState) => Die[];
  canRoll: (diceState: DiceState) => boolean;
  canSelect: (diceState: DiceState) => boolean;
  isTurnComplete: (diceState: DiceState) => boolean;
}

export const useMultiplayerDice = (): UseMultiplayerDiceReturn => {
  // Get available dice (not selected, not on silver tray)
  const getAvailableDice = useCallback((diceState: DiceState): Die[] => {
    return diceState.dice.filter((d) => !d.isOnSilverTray && !d.isSelected);
  }, []);

  // Get silver tray dice
  const getSilverTrayDice = useCallback((diceState: DiceState): Die[] => {
    return diceState.silverTray;
  }, []);

  // Get selected dice
  const getSelectedDice = useCallback((diceState: DiceState): Die[] => {
    return diceState.selectedDice;
  }, []);

  // Check if can roll
  const canRoll = useCallback((diceState: DiceState): boolean => {
    const available = getAvailableDice(diceState);
    return diceState.rollNumber <= ROLLS_PER_TURN && available.length > 0;
  }, [getAvailableDice]);

  // Check if can select
  const canSelect = useCallback((diceState: DiceState): boolean => {
    const available = getAvailableDice(diceState);
    return available.length > 0 && diceState.selectedDice.length < SELECTIONS_PER_TURN;
  }, [getAvailableDice]);

  // Check if turn is complete
  const isTurnComplete = useCallback((diceState: DiceState): boolean => {
    const available = getAvailableDice(diceState);
    return (
      diceState.selectedDice.length >= SELECTIONS_PER_TURN || available.length === 0
    );
  }, [getAvailableDice]);

  // Roll all available dice
  const rollDice = useCallback((diceState: DiceState): DiceState => {
    if (!canRoll(diceState)) {
      return diceState;
    }

    const newDice = diceState.dice.map((die) =>
      die.isOnSilverTray || die.isSelected
        ? die
        : { ...die, value: rollDieValue() }
    );

    // Increment roll number when manually rolling (4 means no more rolls available)
    const newRollNumber = Math.min(diceState.rollNumber + 1, 4) as 1 | 2 | 3 | 4;

    return {
      ...diceState,
      dice: newDice,
      rollNumber: newRollNumber,
      mustRollBeforeSelect: false, // After rolling, player can select
    };
  }, [canRoll]);

  // Select a die - moves lower value dice to silver tray
  const selectDie = useCallback((diceState: DiceState, dieId: string): DiceState => {
    if (diceState.selectedDice.length >= SELECTIONS_PER_TURN) {
      return diceState;
    }

    const selectedDie = diceState.dice.find((d) => d.id === dieId);
    if (!selectedDie || selectedDie.isOnSilverTray || selectedDie.isSelected) {
      return diceState;
    }

    const selectedValue = selectedDie.value;
    const newSilverTray: Die[] = [...diceState.silverTray];
    const newSelectedCount = diceState.selectedDice.length + 1;
    const isLastSelection = newSelectedCount >= SELECTIONS_PER_TURN;

    // Update dice: mark selected, move lower values to silver tray
    // Note: Remaining dice are NOT auto-rerolled - player must manually click "Roll Dice"
    const updatedDice = diceState.dice.map((die) => {
      if (die.id === dieId) {
        return { ...die, isSelected: true };
      }
      if (die.isOnSilverTray || die.isSelected) {
        return die;
      }
      // Move lower value dice to silver tray
      if (die.value < selectedValue) {
        const silverTrayDie = { ...die, isOnSilverTray: true };
        newSilverTray.push(silverTrayDie);
        return silverTrayDie;
      }
      // If this is the last (3rd) selection, move ALL remaining dice to silver tray
      if (isLastSelection) {
        const silverTrayDie = { ...die, isOnSilverTray: true };
        newSilverTray.push(silverTrayDie);
        return silverTrayDie;
      }
      // Keep remaining dice as-is (no auto-reroll)
      return die;
    });

    const newSelectedDie = updatedDice.find((d) => d.id === dieId)!;

    return {
      dice: updatedDice,
      rollNumber: diceState.rollNumber, // Don't increment - only manual roll increments this
      silverTray: newSilverTray,
      selectedDice: [...diceState.selectedDice, newSelectedDie],
      mustRollBeforeSelect: true, // After selecting, player must roll before selecting again
    };
  }, []);

  // Select a die from the silver tray (passive player)
  const selectFromSilverTray = useCallback((
    diceState: DiceState,
    dieId: string
  ): { die: Die; newState: DiceState } | null => {
    const silverDie = diceState.silverTray.find((d) => d.id === dieId);
    if (!silverDie) {
      return null;
    }

    // Remove from silver tray (the passive player uses it)
    const newSilverTray = diceState.silverTray.filter((d) => d.id !== dieId);

    return {
      die: silverDie,
      newState: {
        ...diceState,
        silverTray: newSilverTray,
      },
    };
  }, []);

  // Apply +1 bonus to a die
  const applyPlusOne = useCallback((diceState: DiceState, dieId: string): DiceState => {
    const updateDie = (die: Die): Die => {
      if (die.id !== dieId) return die;
      // +1 wraps around: 6 + 1 = 1
      const newValue = die.value >= 6 ? 1 : die.value + 1;
      return { ...die, value: newValue };
    };

    return {
      ...diceState,
      dice: diceState.dice.map(updateDie),
      silverTray: diceState.silverTray.map(updateDie),
      selectedDice: diceState.selectedDice.map(updateDie),
    };
  }, []);

  // Reset for a new turn
  const resetForNewTurn = useCallback((): DiceState => {
    return {
      dice: createInitialDice(),
      rollNumber: 1,
      silverTray: [],
      selectedDice: [],
      mustRollBeforeSelect: false, // Fresh turn with pre-rolled dice, can select immediately
    };
  }, []);

  return {
    rollDice,
    selectDie,
    selectFromSilverTray,
    applyPlusOne,
    resetForNewTurn,
    getAvailableDice,
    getSilverTrayDice,
    getSelectedDice,
    canRoll,
    canSelect,
    isTurnComplete,
  };
};

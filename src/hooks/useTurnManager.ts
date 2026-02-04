import { useCallback, useMemo } from 'react';
import { GameState, GamePhase, PlayerId, DiceState } from '../types/game';
import { Die } from '../types/dice';
import { MAX_SELECTIONS_ACTIVE, MAX_ROLLS, TOTAL_ROUNDS } from '../constants/scorecard';

interface TurnInfo {
  isMyTurn: boolean;
  isActivePlayer: boolean;
  canRoll: boolean;
  canSelect: boolean;
  canEndTurn: boolean;
  mustSelectFromSilverTray: boolean;
  selectionsRemaining: number;
  rollsRemaining: number;
  currentRound: number;
  totalRounds: number;
  phaseDescription: string;
}

interface UseTurnManagerReturn {
  getTurnInfo: (gameState: GameState, playerId: PlayerId) => TurnInfo;
  getNextPhase: (gameState: GameState, action: 'roll' | 'select' | 'mark' | 'end_turn') => GamePhase;
  isGameOver: (gameState: GameState) => boolean;
  getWinner: (gameState: GameState) => PlayerId | 'tie' | null;
}

export const useTurnManager = (): UseTurnManagerReturn => {
  // Get information about the current turn
  const getTurnInfo = useCallback((
    gameState: GameState,
    playerId: PlayerId
  ): TurnInfo => {
    const isActivePlayer = gameState.activePlayerId === playerId;
    const { phase, diceState, currentRound } = gameState;

    // Determine if it's this player's turn to act
    const isMyTurn = (isActivePlayer && ['rolling', 'selecting', 'marking'].includes(phase)) ||
                     (!isActivePlayer && phase === 'passive_turn');

    // Calculate selections made (Firebase removes empty arrays, so default to empty)
    const selectedDice = diceState?.selectedDice || [];
    const dice = diceState?.dice || [];
    const selectionsMade = selectedDice.length;
    const selectionsRemaining = isActivePlayer
      ? MAX_SELECTIONS_ACTIVE - selectionsMade
      : 1; // Passive player gets 1 selection from silver tray

    // Calculate rolls remaining
    const rollsRemaining = MAX_ROLLS - (diceState?.rollNumber || 1) + 1;

    // Available dice for selection
    const availableDice = dice.filter(
      d => !d.isSelected && !d.isOnSilverTray
    );

    // Can roll? Active player can roll in selecting or marking phase if they have rolls remaining
    const rollNumber = diceState?.rollNumber || 1;
    const canRoll = isActivePlayer &&
                    (phase === 'selecting' || phase === 'marking') &&
                    rollNumber <= MAX_ROLLS &&
                    availableDice.length > 0;

    // Can select? Active player can select in selecting or marking phase with selections remaining
    // After selecting a die, player must roll before selecting again (unless no rolls left)
    const mustRollFirst = diceState?.mustRollBeforeSelect === true && rollNumber <= MAX_ROLLS;
    const canSelect = isActivePlayer &&
                      (phase === 'selecting' || phase === 'marking') &&
                      selectionsRemaining > 0 &&
                      availableDice.length > 0 &&
                      !mustRollFirst;

    // Can end turn? Active player can end when they've selected at least one die
    const hasSelectedDice = selectionsMade > 0;
    const canEndTurn = (isActivePlayer && phase === 'marking' && hasSelectedDice) ||
                       (!isActivePlayer && phase === 'passive_turn');

    // Must select from silver tray? (passive player)
    const mustSelectFromSilverTray = !isActivePlayer && phase === 'passive_turn';

    // Phase description
    let phaseDescription = '';
    switch (phase) {
      case 'lobby':
        phaseDescription = 'Waiting for players...';
        break;
      case 'rolling':
        if (isActivePlayer) {
          phaseDescription = `Roll ${diceState?.rollNumber || 1} of ${MAX_ROLLS}`;
        } else {
          phaseDescription = 'Opponent is rolling...';
        }
        break;
      case 'selecting':
        if (isActivePlayer) {
          phaseDescription = `Select dice (${selectionsMade}/${MAX_SELECTIONS_ACTIVE})`;
        } else {
          phaseDescription = 'Opponent is selecting...';
        }
        break;
      case 'marking':
        if (isActivePlayer) {
          phaseDescription = 'Mark your scorecard';
        } else {
          phaseDescription = 'Opponent is marking...';
        }
        break;
      case 'passive_turn':
        if (!isActivePlayer) {
          phaseDescription = 'Choose a die from the silver tray';
        } else {
          phaseDescription = 'Opponent is choosing...';
        }
        break;
      case 'game_over':
        phaseDescription = 'Game Over!';
        break;
    }

    return {
      isMyTurn,
      isActivePlayer,
      canRoll,
      canSelect,
      canEndTurn,
      mustSelectFromSilverTray,
      selectionsRemaining,
      rollsRemaining,
      currentRound,
      totalRounds: TOTAL_ROUNDS,
      phaseDescription,
    };
  }, []);

  // Determine the next phase based on current state and action
  const getNextPhase = useCallback((
    gameState: GameState,
    action: 'roll' | 'select' | 'mark' | 'end_turn'
  ): GamePhase => {
    const { phase, diceState } = gameState;
    const selectedDice = diceState?.selectedDice || [];
    const dice = diceState?.dice || [];

    switch (action) {
      case 'roll':
        // After rolling, player can select
        return 'selecting';

      case 'select': {
        // After selecting, check if more selections available
        const selectionsMade = selectedDice.length + 1; // +1 for current selection
        const availableAfter = dice.filter(
          d => !d.isSelected && !d.isOnSilverTray
        ).length - 1;

        if (selectionsMade >= MAX_SELECTIONS_ACTIVE || availableAfter === 0) {
          // Move to marking phase
          return 'marking';
        }
        // Can continue selecting or roll again
        return 'selecting';
      }

      case 'mark':
        // Stay in marking phase until end_turn
        return 'marking';

      case 'end_turn':
        if (phase === 'marking') {
          // Active player done, passive player's turn
          return 'passive_turn';
        }
        if (phase === 'passive_turn') {
          // Check if game is over
          const { currentRound, activePlayerId } = gameState;
          const isPlayer2 = activePlayerId === 'player2';

          if (isPlayer2 && currentRound >= TOTAL_ROUNDS) {
            return 'game_over';
          }
          // Next player's turn starts with rolling
          return 'rolling';
        }
        return phase;

      default:
        return phase;
    }
  }, []);

  // Check if game is over
  const isGameOver = useCallback((gameState: GameState): boolean => {
    return gameState.phase === 'game_over';
  }, []);

  // Determine the winner
  const getWinner = useCallback((gameState: GameState): PlayerId | 'tie' | null => {
    if (!isGameOver(gameState)) {
      return null;
    }

    const player1Score = gameState.scorecards.player1.totalScore;
    const player2Score = gameState.scorecards.player2.totalScore;

    if (player1Score > player2Score) {
      return 'player1';
    }
    if (player2Score > player1Score) {
      return 'player2';
    }
    return 'tie';
  }, [isGameOver]);

  return {
    getTurnInfo,
    getNextPhase,
    isGameOver,
    getWinner,
  };
};

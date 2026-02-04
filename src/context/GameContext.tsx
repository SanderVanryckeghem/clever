import React, { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { useFirebaseGame } from '../hooks/useFirebaseGame';
import { useScorecard, SectionType } from '../hooks/useScorecard';
import { useTurnManager } from '../hooks/useTurnManager';
import { useMultiplayerDice, createInitialDice } from '../hooks/useMultiplayerDice';
import {
  GameState,
  GamePhase,
  PlayerId,
  Scorecard,
  DiceState,
  createInitialScorecard,
} from '../types/game';
import { Die } from '../types/dice';

// Normalize scorecard from Firebase (handles missing arrays/nulls)
const normalizeScorecard = (sc: Scorecard | null | undefined): Scorecard | null => {
  if (!sc) return null;
  return {
    yellow: {
      grid: sc.yellow?.grid || [[false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false]],
      score: sc.yellow?.score || 0,
    },
    blue: {
      cells: sc.blue?.cells || Array(11).fill(false),
      score: sc.blue?.score || 0,
    },
    green: {
      values: sc.green?.values || Array(11).fill(null),
      score: sc.green?.score || 0,
    },
    orange: {
      values: sc.orange?.values || Array(11).fill(null),
      score: sc.orange?.score || 0,
    },
    purple: {
      values: sc.purple?.values || Array(11).fill(null),
      score: sc.purple?.score || 0,
    },
    bonuses: {
      rerolls: sc.bonuses?.rerolls || 0,
      plusOnes: sc.bonuses?.plusOnes || 0,
      extraDice: sc.bonuses?.extraDice || { yellow: false, blue: false, green: false, orange: false, purple: false },
      foxes: sc.bonuses?.foxes || 0,
    },
    totalScore: sc.totalScore || 0,
  };
};

// Screen types for navigation
export type Screen = 'lobby' | 'game';

interface GameContextValue {
  // Navigation
  currentScreen: Screen;

  // Firebase state
  gameState: GameState | null;
  playerId: PlayerId | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;

  // Derived state
  isMyTurn: boolean;
  isActivePlayer: boolean;
  myScorecard: Scorecard | null;
  opponentScorecard: Scorecard | null;
  myName: string | null;
  opponentName: string | null;

  // Turn info
  canRoll: boolean;
  canSelect: boolean;
  canEndTurn: boolean;
  mustSelectFromSilverTray: boolean;
  rollsRemaining: number;
  selectionsRemaining: number;
  phaseDescription: string;

  // Dice state helpers
  availableDice: Die[];
  silverTrayDice: Die[];
  selectedDice: Die[];

  // Actions
  createGame: (playerName: string) => Promise<string>;
  joinGame: (roomCode: string, playerName: string) => Promise<void>;
  startGame: () => Promise<void>;
  rollDice: () => Promise<void>;
  selectDie: (dieId: string) => Promise<void>;
  selectFromSilverTray: (dieId: string) => Promise<Die | null>;
  markScorecard: (
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ) => Promise<boolean>;
  endTurn: () => Promise<void>;
  useReroll: () => Promise<void>;
  usePlusOne: (dieId: string) => Promise<void>;
  leaveGame: () => void;

  // Validation
  canMarkPosition: (
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ) => boolean;
  getValidPositions: (
    section: SectionType,
    dieValue: number,
    whiteValue?: number
  ) => (number | { row: number; col: number })[];

  // Game over
  isGameOver: boolean;
  winner: PlayerId | 'tie' | null;
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const firebase = useFirebaseGame();
  const scorecard = useScorecard();
  const turnManager = useTurnManager();
  const multiplayerDice = useMultiplayerDice();

  // Current screen based on game state
  const currentScreen: Screen = useMemo(() => {
    if (!firebase.gameState || firebase.gameState.phase === 'lobby') {
      return 'lobby';
    }
    return 'game';
  }, [firebase.gameState]);

  // Derived state
  const turnInfo = useMemo(() => {
    if (!firebase.gameState || !firebase.playerId) {
      return null;
    }
    // Only get turn info if we have dice state (game has started)
    if (!firebase.gameState.diceState && firebase.gameState.phase !== 'lobby') {
      return null;
    }
    return turnManager.getTurnInfo(firebase.gameState, firebase.playerId);
  }, [firebase.gameState, firebase.playerId, turnManager]);

  const isMyTurn = turnInfo?.isMyTurn ?? false;
  const isActivePlayer = turnInfo?.isActivePlayer ?? false;

  // My scorecard (normalized to handle Firebase's missing arrays)
  const myScorecard = useMemo(() => {
    if (!firebase.gameState || !firebase.playerId) return null;
    return normalizeScorecard(firebase.gameState.scorecards?.[firebase.playerId]);
  }, [firebase.gameState, firebase.playerId]);

  // Opponent scorecard (normalized)
  const opponentScorecard = useMemo(() => {
    if (!firebase.gameState || !firebase.playerId) return null;
    const opponentId: PlayerId = firebase.playerId === 'player1' ? 'player2' : 'player1';
    return normalizeScorecard(firebase.gameState.scorecards?.[opponentId]);
  }, [firebase.gameState, firebase.playerId]);

  // Names
  const myName = useMemo(() => {
    if (!firebase.gameState || !firebase.playerId) return null;
    return firebase.gameState.players[firebase.playerId]?.name ?? null;
  }, [firebase.gameState, firebase.playerId]);

  const opponentName = useMemo(() => {
    if (!firebase.gameState || !firebase.playerId) return null;
    const opponentId: PlayerId = firebase.playerId === 'player1' ? 'player2' : 'player1';
    return firebase.gameState.players[opponentId]?.name ?? null;
  }, [firebase.gameState, firebase.playerId]);

  // Dice state - ensure arrays exist (Firebase removes empty arrays)
  const diceState = useMemo(() => {
    const ds = firebase.gameState?.diceState;
    if (!ds) return null;
    return {
      ...ds,
      dice: ds.dice || [],
      silverTray: ds.silverTray || [],
      selectedDice: ds.selectedDice || [],
    };
  }, [firebase.gameState?.diceState]);

  const availableDice = useMemo(
    () => (diceState ? multiplayerDice.getAvailableDice(diceState) : []),
    [diceState, multiplayerDice]
  );
  const silverTrayDice = useMemo(
    () => (diceState ? multiplayerDice.getSilverTrayDice(diceState) : []),
    [diceState, multiplayerDice]
  );
  const selectedDice = useMemo(
    () => (diceState ? multiplayerDice.getSelectedDice(diceState) : []),
    [diceState, multiplayerDice]
  );

  // Game over state
  const isGameOver = firebase.gameState
    ? turnManager.isGameOver(firebase.gameState)
    : false;
  const winner = firebase.gameState
    ? turnManager.getWinner(firebase.gameState)
    : null;

  // Start the game (when both players ready)
  const startGame = useCallback(async () => {
    if (!firebase.gameState) return;

    // Check both players are present
    if (!firebase.gameState.players.player1 || !firebase.gameState.players.player2) {
      return;
    }

    // Initialize dice and start rolling phase
    const initialDice = createInitialDice();
    const initialDiceState: DiceState = {
      dice: initialDice,
      rollNumber: 1,
      silverTray: [],
      selectedDice: [],
    };

    await firebase.updateDiceState(initialDiceState);
    await firebase.updatePhase('rolling');
  }, [firebase]);

  // Roll dice
  const rollDice = useCallback(async () => {
    if (!firebase.gameState || !diceState) return;
    if (!turnInfo?.canRoll) return;

    const newDiceState = multiplayerDice.rollDice(diceState);
    await firebase.updateDiceState(newDiceState);

    // Move to selecting phase after roll
    if (firebase.gameState.phase === 'rolling') {
      await firebase.updatePhase('selecting');
    }
  }, [firebase, diceState, turnInfo, multiplayerDice]);

  // Select a die (active player)
  const selectDie = useCallback(async (dieId: string) => {
    if (!firebase.gameState || !diceState) return;
    if (!turnInfo?.canSelect) return;

    const newDiceState = multiplayerDice.selectDie(diceState, dieId);
    await firebase.updateDiceState(newDiceState);

    // Check if we should move to marking phase
    if (
      newDiceState.selectedDice.length >= 3 ||
      multiplayerDice.getAvailableDice(newDiceState).length === 0
    ) {
      await firebase.updatePhase('marking');
    }
  }, [firebase, diceState, turnInfo, multiplayerDice]);

  // Select from silver tray (passive player)
  const selectFromSilverTray = useCallback(async (dieId: string): Promise<Die | null> => {
    if (!firebase.gameState || !diceState) return null;
    if (!turnInfo?.mustSelectFromSilverTray) return null;

    const result = multiplayerDice.selectFromSilverTray(diceState, dieId);
    if (!result) return null;

    await firebase.updateDiceState(result.newState);
    return result.die;
  }, [firebase, diceState, turnInfo, multiplayerDice]);

  // Mark scorecard
  const markScorecard = useCallback(async (
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ): Promise<boolean> => {
    if (!firebase.gameState || !firebase.playerId || !myScorecard) return false;

    const result = scorecard.markPosition(myScorecard, section, position, dieValue, whiteValue);
    if (!result.success) return false;

    await firebase.updateScorecard(firebase.playerId, result.newScorecard);
    return true;
  }, [firebase, myScorecard, scorecard]);

  // End turn
  const endTurn = useCallback(async () => {
    if (!firebase.gameState || !turnInfo?.canEndTurn) return;

    if (firebase.gameState.phase === 'marking') {
      // Active player done, passive player's turn
      await firebase.updatePhase('passive_turn');
    } else if (firebase.gameState.phase === 'passive_turn') {
      // Both players done, advance to next turn
      await firebase.advanceTurn();
    }
  }, [firebase, turnInfo]);

  // Use reroll bonus
  const useReroll = useCallback(async () => {
    if (!firebase.gameState || !firebase.playerId || !myScorecard || !diceState) return;
    if (myScorecard.bonuses.rerolls <= 0) return;
    if (!isActivePlayer) return;

    // Decrement reroll count
    const newScorecard = {
      ...myScorecard,
      bonuses: {
        ...myScorecard.bonuses,
        rerolls: myScorecard.bonuses.rerolls - 1,
      },
    };

    // Roll the dice
    const newDiceState = multiplayerDice.rollDice(diceState);

    await firebase.updateScorecard(firebase.playerId, newScorecard);
    await firebase.updateDiceState(newDiceState);
  }, [firebase, myScorecard, diceState, isActivePlayer, multiplayerDice]);

  // Use +1 bonus
  const usePlusOne = useCallback(async (dieId: string) => {
    if (!firebase.gameState || !firebase.playerId || !myScorecard || !diceState) return;
    if (myScorecard.bonuses.plusOnes <= 0) return;

    // Decrement +1 count
    const newScorecard = {
      ...myScorecard,
      bonuses: {
        ...myScorecard.bonuses,
        plusOnes: myScorecard.bonuses.plusOnes - 1,
      },
    };

    // Apply +1 to the die
    const newDiceState = multiplayerDice.applyPlusOne(diceState, dieId);

    await firebase.updateScorecard(firebase.playerId, newScorecard);
    await firebase.updateDiceState(newDiceState);
  }, [firebase, myScorecard, diceState, multiplayerDice]);

  // Leave game
  const leaveGame = useCallback(() => {
    firebase.disconnect();
  }, [firebase]);

  // Validation helpers
  const canMarkPosition = useCallback((
    section: SectionType,
    position: number | { row: number; col: number },
    dieValue: number,
    whiteValue?: number
  ): boolean => {
    if (!myScorecard) return false;
    return scorecard.canMark(myScorecard, section, position, dieValue, whiteValue);
  }, [myScorecard, scorecard]);

  const getValidPositions = useCallback((
    section: SectionType,
    dieValue: number,
    whiteValue?: number
  ): (number | { row: number; col: number })[] => {
    if (!myScorecard) return [];
    return scorecard.getValidPositions(myScorecard, section, dieValue, whiteValue);
  }, [myScorecard, scorecard]);

  const value: GameContextValue = {
    // Navigation
    currentScreen,

    // Firebase state
    gameState: firebase.gameState,
    playerId: firebase.playerId,
    sessionId: firebase.sessionId,
    isLoading: firebase.isLoading,
    error: firebase.error,
    isConnected: firebase.isConnected,

    // Derived state
    isMyTurn,
    isActivePlayer,
    myScorecard,
    opponentScorecard,
    myName,
    opponentName,

    // Turn info
    canRoll: turnInfo?.canRoll ?? false,
    canSelect: turnInfo?.canSelect ?? false,
    canEndTurn: turnInfo?.canEndTurn ?? false,
    mustSelectFromSilverTray: turnInfo?.mustSelectFromSilverTray ?? false,
    rollsRemaining: turnInfo?.rollsRemaining ?? 0,
    selectionsRemaining: turnInfo?.selectionsRemaining ?? 0,
    phaseDescription: turnInfo?.phaseDescription ?? '',

    // Dice state
    availableDice,
    silverTrayDice,
    selectedDice,

    // Actions
    createGame: firebase.createGame,
    joinGame: firebase.joinGame,
    startGame,
    rollDice,
    selectDie,
    selectFromSilverTray,
    markScorecard,
    endTurn,
    useReroll,
    usePlusOne,
    leaveGame,

    // Validation
    canMarkPosition,
    getValidPositions,

    // Game over
    isGameOver,
    winner,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = (): GameContextValue => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

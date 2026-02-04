import { Die } from './dice';
import { PlayerId, Scorecard, GamePhase } from './game';

// All possible game actions
export type GameAction =
  | CreateGameAction
  | JoinGameAction
  | StartGameAction
  | RollDiceAction
  | SelectDieAction
  | MarkScorecardAction
  | SelectPassiveDieAction
  | EndTurnAction
  | UseRerollAction
  | UsePlusOneAction;

// Create a new game room
export interface CreateGameAction {
  type: 'CREATE_GAME';
  payload: {
    playerName: string;
    sessionId: string;
  };
}

// Join an existing game
export interface JoinGameAction {
  type: 'JOIN_GAME';
  payload: {
    roomCode: string;
    playerName: string;
    sessionId: string;
  };
}

// Start the game (when both players are ready)
export interface StartGameAction {
  type: 'START_GAME';
}

// Roll the dice
export interface RollDiceAction {
  type: 'ROLL_DICE';
  payload: {
    playerId: PlayerId;
  };
}

// Select a die (active player)
export interface SelectDieAction {
  type: 'SELECT_DIE';
  payload: {
    playerId: PlayerId;
    dieId: string;
  };
}

// Mark a position on the scorecard
export interface MarkScorecardAction {
  type: 'MARK_SCORECARD';
  payload: {
    playerId: PlayerId;
    section: 'yellow' | 'blue' | 'green' | 'orange' | 'purple';
    position: number | { row: number; col: number }; // number for linear sections, {row, col} for yellow grid
    dieValue: number;
    dieColor?: string; // For blue section which uses blue+white
  };
}

// Passive player selects from silver tray
export interface SelectPassiveDieAction {
  type: 'SELECT_PASSIVE_DIE';
  payload: {
    playerId: PlayerId;
    dieId: string;
  };
}

// End the current turn
export interface EndTurnAction {
  type: 'END_TURN';
  payload: {
    playerId: PlayerId;
  };
}

// Use a reroll bonus
export interface UseRerollAction {
  type: 'USE_REROLL';
  payload: {
    playerId: PlayerId;
  };
}

// Use a +1 bonus on a die
export interface UsePlusOneAction {
  type: 'USE_PLUS_ONE';
  payload: {
    playerId: PlayerId;
    dieId: string;
  };
}

// Action result for validation
export interface ActionResult {
  success: boolean;
  error?: string;
  newPhase?: GamePhase;
}

// Type guard for action types
export const isGameAction = (action: unknown): action is GameAction => {
  if (typeof action !== 'object' || action === null) return false;
  const a = action as { type?: string };
  return typeof a.type === 'string' && [
    'CREATE_GAME',
    'JOIN_GAME',
    'START_GAME',
    'ROLL_DICE',
    'SELECT_DIE',
    'MARK_SCORECARD',
    'SELECT_PASSIVE_DIE',
    'END_TURN',
    'USE_REROLL',
    'USE_PLUS_ONE',
  ].includes(a.type);
};

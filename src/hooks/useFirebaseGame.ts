import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  onDisconnect,
  serverTimestamp,
} from 'firebase/database';
import { database, ensureAuthenticated, generateRoomCode } from '../config/firebase';
import {
  GameState,
  PlayerId,
  Player,
  createInitialGameState,
  DiceState,
  Scorecard,
  GamePhase,
} from '../types/game';
import { Die, DiceColor } from '../types/dice';
import { DICE_COLORS } from '../constants/game';

interface UseFirebaseGameReturn {
  gameState: GameState | null;
  playerId: PlayerId | null;
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;

  // Lobby actions
  createGame: (playerName: string) => Promise<string>;
  joinGame: (roomCode: string, playerName: string) => Promise<void>;

  // Game actions
  updateDiceState: (diceState: DiceState) => Promise<void>;
  updateScorecard: (playerId: PlayerId, scorecard: Scorecard) => Promise<void>;
  updatePhase: (phase: GamePhase) => Promise<void>;
  advanceTurn: () => Promise<void>;
  endGame: () => Promise<void>;

  // Connection
  disconnect: () => void;
}

export const useFirebaseGame = (): UseFirebaseGameReturn => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<PlayerId | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);

  const gameRef = useRef<ReturnType<typeof ref> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize authentication
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await ensureAuthenticated();
        setSessionId(user.uid);
      } catch (err) {
        setError('Failed to authenticate');
        console.error('Auth error:', err);
      }
    };
    initAuth();
  }, []);

  // Subscribe to game updates
  useEffect(() => {
    if (!roomCode || !sessionId) return;

    const gameReference = ref(database, `games/${roomCode}`);
    gameRef.current = gameReference;

    const handleValue = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        setGameState(data as GameState);
        setIsConnected(true);
      } else {
        setError('Game not found');
        setIsConnected(false);
      }
    };

    onValue(gameReference, handleValue, (err) => {
      setError('Failed to sync with game');
      setIsConnected(false);
      console.error('Firebase sync error:', err);
    });

    unsubscribeRef.current = () => {
      off(gameReference);
    };

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [roomCode, sessionId]);

  // Set up presence (disconnect handling)
  useEffect(() => {
    if (!roomCode || !sessionId || !playerId) return;

    const playerRef = ref(database, `games/${roomCode}/players/${playerId}`);
    const connectedRef = ref(database, '.info/connected');

    const handleConnectedChange = (snapshot: any) => {
      if (snapshot.val() === true) {
        // When we connect, set up disconnect handler
        onDisconnect(playerRef).update({
          isConnected: false,
        });

        // Mark as connected
        update(playerRef, { isConnected: true });
      }
    };

    onValue(connectedRef, handleConnectedChange);

    return () => {
      off(connectedRef);
    };
  }, [roomCode, sessionId, playerId]);

  // Create a new game
  const createGame = useCallback(async (playerName: string): Promise<string> => {
    if (!sessionId) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      let code: string;
      let attempts = 0;

      // Generate unique room code
      do {
        code = generateRoomCode();
        const snapshot = await get(ref(database, `games/${code}`));
        if (!snapshot.exists()) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('Failed to generate unique room code');
      }

      const initialState = createInitialGameState(code);
      const player: Player = {
        name: playerName,
        sessionId,
        isConnected: true,
      };

      const gameData: GameState = {
        ...initialState,
        players: {
          player1: player,
          player2: null,
        },
      };

      await set(ref(database, `games/${code}`), gameData);

      setRoomCode(code);
      setPlayerId('player1');
      setIsLoading(false);

      return code;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create game';
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }
  }, [sessionId]);

  // Join an existing game
  const joinGame = useCallback(async (code: string, playerName: string): Promise<void> => {
    if (!sessionId) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const normalizedCode = code.toUpperCase().trim();
      const gameSnapshot = await get(ref(database, `games/${normalizedCode}`));

      if (!gameSnapshot.exists()) {
        throw new Error('Game not found');
      }

      const game = gameSnapshot.val() as GameState;

      // Check if game is joinable
      if (game.phase !== 'lobby') {
        throw new Error('Game has already started');
      }

      // Check if player is already in the game (reconnecting)
      if (game.players.player1?.sessionId === sessionId) {
        setRoomCode(normalizedCode);
        setPlayerId('player1');
        await update(ref(database, `games/${normalizedCode}/players/player1`), {
          isConnected: true,
        });
        setIsLoading(false);
        return;
      }

      if (game.players.player2?.sessionId === sessionId) {
        setRoomCode(normalizedCode);
        setPlayerId('player2');
        await update(ref(database, `games/${normalizedCode}/players/player2`), {
          isConnected: true,
        });
        setIsLoading(false);
        return;
      }

      // Check if slot is available (Firebase removes null values, so check for undefined too)
      if (game.players.player2 !== null && game.players.player2 !== undefined) {
        throw new Error('Game is full');
      }

      // Join as player 2
      const player: Player = {
        name: playerName,
        sessionId,
        isConnected: true,
      };

      await update(ref(database, `games/${normalizedCode}/players`), {
        player2: player,
      });

      setRoomCode(normalizedCode);
      setPlayerId('player2');
      setIsLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join game';
      setError(message);
      setIsLoading(false);
      throw new Error(message);
    }
  }, [sessionId]);

  // Update dice state
  const updateDiceState = useCallback(async (diceState: DiceState): Promise<void> => {
    if (!roomCode) {
      throw new Error('Not in a game');
    }

    try {
      await update(ref(database, `games/${roomCode}`), {
        diceState,
        lastUpdatedAt: Date.now(),
      });
    } catch (err) {
      setError('Failed to update dice');
      throw err;
    }
  }, [roomCode]);

  // Update scorecard
  const updateScorecard = useCallback(async (
    targetPlayerId: PlayerId,
    scorecard: Scorecard
  ): Promise<void> => {
    if (!roomCode) {
      throw new Error('Not in a game');
    }

    try {
      await update(ref(database, `games/${roomCode}/scorecards`), {
        [targetPlayerId]: scorecard,
      });
    } catch (err) {
      setError('Failed to update scorecard');
      throw err;
    }
  }, [roomCode]);

  // Update game phase
  const updatePhase = useCallback(async (phase: GamePhase): Promise<void> => {
    if (!roomCode) {
      throw new Error('Not in a game');
    }

    try {
      await update(ref(database, `games/${roomCode}`), {
        phase,
        lastUpdatedAt: Date.now(),
      });
    } catch (err) {
      setError('Failed to update phase');
      throw err;
    }
  }, [roomCode]);

  // Advance to next turn
  const advanceTurn = useCallback(async (): Promise<void> => {
    if (!roomCode || !gameState) {
      throw new Error('Not in a game');
    }

    const currentActive = gameState.activePlayerId;
    const nextActive: PlayerId = currentActive === 'player1' ? 'player2' : 'player1';
    const currentRound = gameState.currentRound;

    // Check if we need to advance the round
    const isEndOfRound = currentActive === 'player2';
    const newRound = isEndOfRound ? currentRound + 1 : currentRound;

    // Check if game is over
    if (newRound > 6) {
      await update(ref(database, `games/${roomCode}`), {
        phase: 'game_over',
        lastUpdatedAt: Date.now(),
      });
      return;
    }

    // Reset dice for new turn
    const newDice: Die[] = DICE_COLORS.map((color): Die => ({
      id: color,
      color: color as DiceColor,
      value: Math.floor(Math.random() * 6) + 1,
      isOnSilverTray: false,
      isSelected: false,
    }));

    const newDiceState: DiceState = {
      dice: newDice,
      rollNumber: 1,
      silverTray: [],
      selectedDice: [],
    };

    await update(ref(database, `games/${roomCode}`), {
      activePlayerId: nextActive,
      currentRound: newRound,
      phase: 'rolling',
      diceState: newDiceState,
      lastUpdatedAt: Date.now(),
    });
  }, [roomCode, gameState]);

  // End the game
  const endGame = useCallback(async (): Promise<void> => {
    if (!roomCode) {
      throw new Error('Not in a game');
    }

    await update(ref(database, `games/${roomCode}`), {
      phase: 'game_over',
      lastUpdatedAt: Date.now(),
    });
  }, [roomCode]);

  // Disconnect from game
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    setGameState(null);
    setPlayerId(null);
    setRoomCode(null);
    setIsConnected(false);
    setError(null);
  }, []);

  return {
    gameState,
    playerId,
    sessionId,
    isLoading,
    error,
    isConnected,
    createGame,
    joinGame,
    updateDiceState,
    updateScorecard,
    updatePhase,
    advanceTurn,
    endGame,
    disconnect,
  };
};

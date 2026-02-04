import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useGame } from '../../context/GameContext';

type LobbyMode = 'menu' | 'create' | 'join' | 'waiting';

export const LobbyScreen: React.FC = () => {
  const game = useGame();
  const [mode, setMode] = useState<LobbyMode>('menu');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [createdRoomCode, setCreatedRoomCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCreateGame = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    setLocalError(null);
    try {
      const code = await game.createGame(playerName.trim());
      setCreatedRoomCode(code);
      setMode('waiting');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to create game');
    }
  };

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    if (!roomCode.trim()) {
      setLocalError('Please enter a room code');
      return;
    }

    setLocalError(null);
    try {
      await game.joinGame(roomCode.trim(), playerName.trim());
      setMode('waiting');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to join game');
    }
  };

  const handleStartGame = async () => {
    try {
      await game.startGame();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to start game');
    }
  };

  const handleBack = () => {
    setMode('menu');
    setLocalError(null);
    setRoomCode('');
    game.leaveGame();
  };

  // Check if both players are connected (Firebase removes null values, so we check for truthy)
  const player1 = game.gameState?.players?.player1;
  const player2 = game.gameState?.players?.player2;
  const bothPlayersReady = Boolean(player1 && player2);
  const isHost = game.playerId === 'player1';

  const error = localError || game.error;

  // Menu screen
  if (mode === 'menu') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Clever</Text>
          <Text style={styles.subtitle}>Ganz Schon Clever</Text>
        </View>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMode('create')}
          >
            <Text style={styles.menuButtonText}>Create Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSecondary]}
            onPress={() => setMode('join')}
          >
            <Text style={styles.menuButtonText}>Join Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonPractice]}
            onPress={game.goToDiceSimulator}
          >
            <Text style={styles.menuButtonText}>Practice Mode</Text>
            <Text style={styles.menuButtonSubtext}>Dice Simulator</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>
    );
  }

  // Create game screen
  if (mode === 'create') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Create Game</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
              maxLength={20}
              autoCapitalize="words"
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.actionButton, game.isLoading && styles.buttonDisabled]}
            onPress={handleCreateGame}
            disabled={game.isLoading}
          >
            {game.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Join game screen
  if (mode === 'join') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Join Game</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Enter your name"
              placeholderTextColor="#888"
              maxLength={20}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Room Code</Text>
            <TextInput
              style={[styles.input, styles.roomCodeInput]}
              value={roomCode}
              onChangeText={(text) => setRoomCode(text.toUpperCase())}
              placeholder="Enter 6-character code"
              placeholderTextColor="#888"
              maxLength={6}
              autoCapitalize="characters"
            />
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            style={[styles.actionButton, game.isLoading && styles.buttonDisabled]}
            onPress={handleJoinGame}
            disabled={game.isLoading}
          >
            {game.isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.actionButtonText}>Join</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Waiting room
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>Leave</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Waiting Room</Text>

      {(createdRoomCode || game.gameState?.roomCode) && (
        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Room Code</Text>
          <Text style={styles.roomCodeDisplay}>
            {createdRoomCode || game.gameState?.roomCode}
          </Text>
          <Text style={styles.roomCodeHint}>
            Share this code with a friend to join!
          </Text>
        </View>
      )}

      <View style={styles.playersContainer}>
        <Text style={styles.playersTitle}>Players</Text>

        <View style={styles.playerRow}>
          <View style={[styles.playerIndicator, player1 ? styles.playerConnected : styles.playerWaiting]} />
          <Text style={styles.playerName}>
            {player1?.name || 'Waiting...'}
            {game.playerId === 'player1' && ' (You)'}
          </Text>
        </View>

        <View style={styles.playerRow}>
          <View
            style={[
              styles.playerIndicator,
              player2 ? styles.playerConnected : styles.playerWaiting,
            ]}
          />
          <Text style={styles.playerName}>
            {player2?.name || 'Waiting for player 2...'}
            {game.playerId === 'player2' && ' (You)'}
          </Text>
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {bothPlayersReady && isHost && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleStartGame}
        >
          <Text style={styles.actionButtonText}>Start Game</Text>
        </TouchableOpacity>
      )}

      {bothPlayersReady && !isHost && (
        <Text style={styles.waitingText}>Waiting for host to start...</Text>
      )}

      {!bothPlayersReady && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4169E1" />
          <Text style={styles.waitingText}>Waiting for another player...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  menuButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  menuButtonSecondary: {
    backgroundColor: '#228B22',
  },
  menuButtonPractice: {
    backgroundColor: '#8B4513',
  },
  menuButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 4,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#4169E1',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  roomCodeInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionButton: {
    backgroundColor: '#4169E1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  roomCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 24,
    marginBottom: 30,
  },
  roomCodeLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  roomCodeDisplay: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  roomCodeHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 12,
  },
  playersContainer: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  playersTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  playerIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  playerConnected: {
    backgroundColor: '#228B22',
  },
  playerWaiting: {
    backgroundColor: '#666',
  },
  playerName: {
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  waitingText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});

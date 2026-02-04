import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGame } from '../../context/GameContext';

interface Props {
  onLeave?: () => void;
}

export const GameHeader: React.FC<Props> = ({ onLeave }) => {
  const game = useGame();

  const { gameState, playerId, myName, opponentName, isActivePlayer } = game;

  if (!gameState) return null;

  const roomCode = gameState.roomCode;
  const currentRound = gameState.currentRound;
  const totalRounds = 6;
  const phase = gameState.phase;

  // Determine turn indicator
  const getTurnText = () => {
    if (phase === 'game_over') {
      return 'Game Over';
    }
    if (isActivePlayer) {
      return "Your Turn";
    }
    return `${opponentName || "Opponent"}'s Turn`;
  };

  // Get phase-specific status
  const getPhaseStatus = () => {
    if (phase === 'rolling') {
      const rollNumber = gameState.diceState?.rollNumber ?? 1;
      return `Roll ${rollNumber} of 3`;
    }
    if (phase === 'selecting') {
      const selectedCount = gameState.diceState?.selectedDice?.length ?? 0;
      return `Select dice (${selectedCount}/3)`;
    }
    if (phase === 'marking') {
      return 'Mark your scorecard';
    }
    if (phase === 'passive_turn') {
      if (!isActivePlayer) {
        return 'Choose from silver tray';
      }
      return 'Opponent choosing...';
    }
    return '';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.leaveButton} onPress={onLeave}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>

        <View style={styles.roomCodeContainer}>
          <Text style={styles.roomCodeLabel}>Room</Text>
          <Text style={styles.roomCode}>{roomCode}</Text>
        </View>

        <View style={styles.roundContainer}>
          <Text style={styles.roundLabel}>Round</Text>
          <Text style={styles.round}>{currentRound}/{totalRounds}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={styles.playersContainer}>
          <View style={styles.playerInfo}>
            <View
              style={[
                styles.playerIndicator,
                isActivePlayer && styles.playerActive,
              ]}
            />
            <Text
              style={[
                styles.playerName,
                isActivePlayer && styles.playerNameActive,
              ]}
            >
              {myName || 'You'}
            </Text>
            <Text style={styles.playerScore}>
              {gameState.scorecards[playerId!]?.totalScore || 0}
            </Text>
          </View>

          <Text style={styles.vs}>vs</Text>

          <View style={styles.playerInfo}>
            <View
              style={[
                styles.playerIndicator,
                !isActivePlayer && gameState.phase !== 'game_over' && styles.playerActive,
              ]}
            />
            <Text
              style={[
                styles.playerName,
                !isActivePlayer && gameState.phase !== 'game_over' && styles.playerNameActive,
              ]}
            >
              {opponentName || 'Opponent'}
            </Text>
            <Text style={styles.playerScore}>
              {gameState.scorecards[playerId === 'player1' ? 'player2' : 'player1']?.totalScore || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.turnIndicator}>
        <Text style={styles.turnText}>{getTurnText()}</Text>
        <Text style={styles.phaseStatus}>{getPhaseStatus()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2a2a3e',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaveButton: {
    padding: 8,
  },
  leaveButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  roomCodeContainer: {
    alignItems: 'center',
  },
  roomCodeLabel: {
    color: '#666',
    fontSize: 10,
  },
  roomCode: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  roundContainer: {
    alignItems: 'center',
  },
  roundLabel: {
    color: '#666',
    fontSize: 10,
  },
  round: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusRow: {
    marginBottom: 12,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
  },
  playerActive: {
    backgroundColor: '#00FF00',
  },
  playerName: {
    color: '#888',
    fontSize: 14,
  },
  playerNameActive: {
    color: '#fff',
    fontWeight: '600',
  },
  playerScore: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  vs: {
    color: '#666',
    fontSize: 12,
  },
  turnIndicator: {
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  turnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  phaseStatus: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
});

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useGame } from '../../context/GameContext';

interface Props {
  visible: boolean;
  onPlayAgain?: () => void;
  onLeave?: () => void;
}

export const GameOverModal: React.FC<Props> = ({
  visible,
  onPlayAgain,
  onLeave,
}) => {
  const game = useGame();
  const { winner, myScorecard, opponentScorecard, myName, opponentName, playerId } = game;

  const myScore = myScorecard?.totalScore ?? 0;
  const opponentScore = opponentScorecard?.totalScore ?? 0;

  const isWinner = winner === playerId;
  const isTie = winner === 'tie';

  const getResultText = () => {
    if (isTie) {
      return "It's a Tie!";
    }
    if (isWinner) {
      return 'You Win!';
    }
    return 'You Lose';
  };

  const getResultColor = () => {
    if (isTie) {
      return '#FFD700';
    }
    if (isWinner) {
      return '#00FF00';
    }
    return '#ff6b6b';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Game Over</Text>

          <Text style={[styles.result, { color: getResultColor() }]}>
            {getResultText()}
          </Text>

          <View style={styles.scoresContainer}>
            <View style={[styles.scoreCard, isWinner && styles.scoreCardWinner]}>
              <Text style={styles.playerLabel}>{myName || 'You'}</Text>
              <Text style={styles.scoreValue}>{myScore}</Text>
              {myScorecard && (
                <View style={styles.breakdown}>
                  <Text style={styles.breakdownText}>Yellow: {myScorecard.yellow.score}</Text>
                  <Text style={styles.breakdownText}>Blue: {myScorecard.blue.score}</Text>
                  <Text style={styles.breakdownText}>Green: {myScorecard.green.score}</Text>
                  <Text style={styles.breakdownText}>Orange: {myScorecard.orange.score}</Text>
                  <Text style={styles.breakdownText}>Purple: {myScorecard.purple.score}</Text>
                  {myScorecard.bonuses.foxes > 0 && (
                    <Text style={styles.breakdownText}>
                      Foxes: {myScorecard.bonuses.foxes} x {Math.min(
                        myScorecard.yellow.score,
                        myScorecard.blue.score,
                        myScorecard.green.score,
                        myScorecard.orange.score,
                        myScorecard.purple.score
                      )}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <View style={[styles.scoreCard, !isWinner && !isTie && styles.scoreCardWinner]}>
              <Text style={styles.playerLabel}>{opponentName || 'Opponent'}</Text>
              <Text style={styles.scoreValue}>{opponentScore}</Text>
              {opponentScorecard && (
                <View style={styles.breakdown}>
                  <Text style={styles.breakdownText}>Yellow: {opponentScorecard.yellow.score}</Text>
                  <Text style={styles.breakdownText}>Blue: {opponentScorecard.blue.score}</Text>
                  <Text style={styles.breakdownText}>Green: {opponentScorecard.green.score}</Text>
                  <Text style={styles.breakdownText}>Orange: {opponentScorecard.orange.score}</Text>
                  <Text style={styles.breakdownText}>Purple: {opponentScorecard.purple.score}</Text>
                  {opponentScorecard.bonuses.foxes > 0 && (
                    <Text style={styles.breakdownText}>
                      Foxes: {opponentScorecard.bonuses.foxes} x {Math.min(
                        opponentScorecard.yellow.score,
                        opponentScorecard.blue.score,
                        opponentScorecard.green.score,
                        opponentScorecard.orange.score,
                        opponentScorecard.purple.score
                      )}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={onLeave}>
              <Text style={styles.buttonText}>Leave Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  result: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoresContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  scoreCardWinner: {
    borderColor: '#FFD700',
  },
  playerLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  scoreValue: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  breakdown: {
    width: '100%',
  },
  breakdownText: {
    color: '#666',
    fontSize: 11,
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 12,
  },
  button: {
    backgroundColor: '#4169E1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

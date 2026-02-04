import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Die } from '../../types/dice';
import { Die as DieComponent } from '../Die';

interface Props {
  silverTrayDice: Die[];
  onSelectDie: (dieId: string) => void;
  disabled?: boolean;
  hasValidMoves?: (die: Die) => boolean;
}

export const PassiveDiceSelection: React.FC<Props> = ({
  silverTrayDice,
  onSelectDie,
  disabled = false,
  hasValidMoves,
}) => {
  if (silverTrayDice.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Silver Tray</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dice on silver tray yet</Text>
          <Text style={styles.emptyHint}>
            Wait for the active player to select dice
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Silver Tray</Text>
      <Text style={styles.subtitle}>
        {disabled
          ? 'Wait for your turn to select'
          : 'Choose one die to use for your scorecard'}
      </Text>

      <View style={styles.diceContainer}>
        {silverTrayDice.map((die) => {
          const canUse = hasValidMoves ? hasValidMoves(die) : true;
          return (
            <View key={die.id} style={styles.dieWrapper}>
              <DieComponent
                die={die}
                onPress={() => onSelectDie(die.id)}
                disabled={disabled}
                size="large"
              />
              {!disabled && canUse && (
                <View style={styles.validMoveIndicator}>
                  <Text style={styles.validMoveText}>✓</Text>
                </View>
              )}
              {!disabled && !canUse && (
                <View style={styles.noMovesIndicator}>
                  <Text style={styles.noMovesText}>✗</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {!disabled && (
        <Text style={styles.hint}>
          ✓ = can be used on your scorecard, ✗ = no valid moves
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C0C0C0',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 16,
  },
  diceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  dieWrapper: {
    position: 'relative',
  },
  validMoveIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#228B22',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  validMoveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noMovesIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2a2a3e',
  },
  noMovesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  emptyHint: {
    color: '#555',
    fontSize: 12,
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

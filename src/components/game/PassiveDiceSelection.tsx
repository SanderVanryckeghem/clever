import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Die } from '../../types/dice';
import { Die as DieComponent } from '../Die';

interface Props {
  silverTrayDice: Die[];
  onSelectDie: (dieId: string) => void;
  disabled?: boolean;
}

export const PassiveDiceSelection: React.FC<Props> = ({
  silverTrayDice,
  onSelectDie,
  disabled = false,
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
        {silverTrayDice.map((die) => (
          <DieComponent
            key={die.id}
            die={die}
            onPress={() => onSelectDie(die.id)}
            disabled={disabled}
            size="large"
          />
        ))}
      </View>

      {!disabled && (
        <Text style={styles.hint}>
          Tap a die to select it
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

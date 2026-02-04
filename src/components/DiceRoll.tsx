import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Die } from './Die';
import { Die as DieType } from '../types/dice';

interface DiceRollProps {
  availableDice: DieType[];
  selectedDice: DieType[];
  silverTrayDice: DieType[];
  rollNumber: number;
  canRoll: boolean;
  canSelect: boolean;
  isTurnComplete: boolean;
  onSelectDie: (id: string) => void;
  onRoll: () => void;
  onReset: () => void;
}

export const DiceRoll: React.FC<DiceRollProps> = ({
  availableDice,
  selectedDice,
  silverTrayDice,
  rollNumber,
  canRoll,
  canSelect,
  isTurnComplete,
  onSelectDie,
  onRoll,
  onReset,
}) => {
  return (
    <View style={styles.container}>
      {/* Roll info */}
      <Text style={styles.rollInfo}>
        Roll {Math.min(rollNumber, 3)} of 3
      </Text>

      {/* Available Dice */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Dice</Text>
        <Text style={styles.hint}>
          {canSelect ? 'Tap a die to select it' : 'Selection complete (3/3)'}
        </Text>
        <View style={styles.diceContainer}>
          {availableDice.map((die) => (
            <Die
              key={die.id}
              die={die}
              onPress={canSelect ? onSelectDie : undefined}
              disabled={!canSelect}
              size="large"
            />
          ))}
          {availableDice.length === 0 && (
            <Text style={styles.emptyText}>No dice available</Text>
          )}
        </View>
      </View>

      {/* Silver Tray */}
      <View style={[styles.section, styles.silverTray]}>
        <Text style={styles.sectionTitle}>Silver Tray</Text>
        <Text style={styles.hint}>Lower value dice (for other players)</Text>
        <View style={styles.diceContainer}>
          {silverTrayDice.map((die) => (
            <Die key={die.id} die={die} disabled size="medium" />
          ))}
          {silverTrayDice.length === 0 && (
            <Text style={styles.emptyText}>Empty</Text>
          )}
        </View>
      </View>

      {/* Selected Dice */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Selected Dice</Text>
        <View style={styles.diceContainer}>
          {selectedDice.map((die) => (
            <Die key={die.id} die={die} disabled size="medium" />
          ))}
          {selectedDice.length === 0 && (
            <Text style={styles.emptyText}>None selected yet</Text>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {!isTurnComplete ? (
          <TouchableOpacity
            style={[styles.button, !canRoll && styles.buttonDisabled]}
            onPress={onRoll}
            disabled={!canRoll}
          >
            <Text style={styles.buttonText}>
              {rollNumber === 1 ? 'Roll Dice' : 'Re-roll'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.resetButton]}
            onPress={onReset}
          >
            <Text style={styles.buttonText}>New Turn</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  rollInfo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  section: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  silverTray: {
    backgroundColor: '#e8e8e8',
    borderWidth: 2,
    borderColor: '#c0c0c0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#444',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  diceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    minHeight: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  resetButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

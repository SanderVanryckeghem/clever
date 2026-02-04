import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { DiceRoll } from '../DiceRoll';
import { useDice } from '../../hooks/useDice';

interface Props {
  onBack: () => void;
}

export const DiceSimulatorScreen: React.FC<Props> = ({ onBack }) => {
  const {
    availableDice,
    selectedDice,
    silverTrayDice,
    rollNumber,
    canRoll,
    canSelect,
    isTurnComplete,
    rollDice,
    selectDie,
    resetTurn,
  } = useDice();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Practice Mode</Text>
          <Text style={styles.subtitle}>Dice Simulator</Text>
        </View>
        <View style={styles.spacer} />
      </View>

      <DiceRoll
        availableDice={availableDice}
        selectedDice={selectedDice}
        silverTrayDice={silverTrayDice}
        rollNumber={rollNumber}
        canRoll={canRoll}
        canSelect={canSelect}
        isTurnComplete={isTurnComplete}
        onSelectDie={selectDie}
        onRoll={rollDice}
        onReset={resetTurn}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#4169E1',
    fontSize: 16,
  },
  titleContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  spacer: {
    width: 50, // Balance the back button
  },
});

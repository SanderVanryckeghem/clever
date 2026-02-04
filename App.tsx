import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { DiceRoll } from './src/components';
import { useDice } from './src/hooks';

export default function App() {
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
        <Text style={styles.title}>Clever</Text>
        <Text style={styles.subtitle}>Dice Roller</Text>
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

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
});

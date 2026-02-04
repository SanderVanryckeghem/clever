import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlueSection as BlueSectionType } from '../../types/game';
import { BLUE_GRID_VALUES } from '../../constants/scorecard';

interface Props {
  section: BlueSectionType;
  onCellPress?: (position: { row: number; col: number }) => void;
  validPositions?: { row: number; col: number }[];
  disabled?: boolean;
}

export const BlueSection: React.FC<Props> = ({
  section,
  onCellPress,
  validPositions = [],
  disabled = false,
}) => {
  const isValidPosition = (row: number, col: number): boolean => {
    return validPositions.some(p => p.row === row && p.col === col);
  };

  const renderCell = (row: number, col: number) => {
    const value = BLUE_GRID_VALUES[row][col];
    // Skip empty cells
    if (value === 0) {
      return <View key={col} style={styles.cellEmpty} />;
    }
    const isCrossed = section.grid[row]?.[col] || false;
    const isValid = isValidPosition(row, col);

    return (
      <TouchableOpacity
        key={col}
        style={[
          styles.cell,
          isCrossed && styles.cellCrossed,
          isValid && !disabled && styles.cellValid,
        ]}
        onPress={() => !disabled && isValid && onCellPress?.({ row, col })}
        disabled={disabled || !isValid}
      >
        <Text style={[styles.cellValue, isCrossed && styles.cellValueCrossed]}>
          {isCrossed ? 'X' : value}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Blue</Text>
        <Text style={styles.score}>Score: {section.score}</Text>
      </View>

      <View style={styles.grid}>
        {[0, 1, 2].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3].map((col) => renderCell(row, col))}
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Blue + White die sum (2-12). Cross off matching values.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4169E1',
  },
  score: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 50,
    height: 50,
    backgroundColor: '#4169E1',
    margin: 3,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#2A4B9B',
  },
  cellEmpty: {
    width: 50,
    height: 50,
    margin: 3,
  },
  cellCrossed: {
    backgroundColor: '#2A4B9B',
  },
  cellValid: {
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cellValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cellValueCrossed: {
    color: '#FFD700',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

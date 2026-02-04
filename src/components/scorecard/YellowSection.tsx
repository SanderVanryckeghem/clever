import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { YellowSection as YellowSectionType } from '../../types/game';
import { YELLOW_GRID_VALUES } from '../../constants/scorecard';

interface Props {
  section: YellowSectionType;
  onCellPress?: (row: number, col: number) => void;
  validPositions?: { row: number; col: number }[];
  disabled?: boolean;
}

export const YellowSection: React.FC<Props> = ({
  section,
  onCellPress,
  validPositions = [],
  disabled = false,
}) => {
  const isValidPosition = (row: number, col: number): boolean => {
    return validPositions.some((pos) => pos.row === row && pos.col === col);
  };

  const renderCell = (row: number, col: number) => {
    const value = YELLOW_GRID_VALUES[row][col];
    const isCrossed = section.grid[row][col];
    const isValid = isValidPosition(row, col);
    const isBonus = value === 0;

    return (
      <TouchableOpacity
        key={`${row}-${col}`}
        style={[
          styles.cell,
          isCrossed && styles.cellCrossed,
          isValid && !disabled && styles.cellValid,
          isBonus && styles.cellBonus,
        ]}
        onPress={() => !disabled && isValid && onCellPress?.(row, col)}
        disabled={disabled || !isValid}
      >
        {isBonus ? (
          <Text style={styles.bonusText}>+</Text>
        ) : (
          <Text style={[styles.cellText, isCrossed && styles.cellTextCrossed]}>
            {isCrossed ? 'X' : value}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Yellow</Text>
        <Text style={styles.score}>Score: {section.score}</Text>
      </View>

      <View style={styles.grid}>
        {[0, 1, 2, 3].map((row) => (
          <View key={row} style={styles.row}>
            {[0, 1, 2, 3].map((col) => renderCell(row, col))}
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Match die value to cross off cells. Complete rows/columns for bonus points.
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
    color: '#FFD700',
  },
  score: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  grid: {
    alignSelf: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 8,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 56,
    height: 56,
    backgroundColor: '#FFD700',
    margin: 4,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CC9900',
  },
  cellCrossed: {
    backgroundColor: '#8B7500',
  },
  cellValid: {
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cellBonus: {
    backgroundColor: '#9B870C',
  },
  cellText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  cellTextCrossed: {
    color: '#FFD700',
  },
  bonusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

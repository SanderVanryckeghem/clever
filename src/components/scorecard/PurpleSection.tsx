import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { PurpleSection as PurpleSectionType } from '../../types/game';

interface Props {
  section: PurpleSectionType;
  onCellPress?: (position: number) => void;
  validPositions?: number[];
  disabled?: boolean;
}

export const PurpleSection: React.FC<Props> = ({
  section,
  onCellPress,
  validPositions = [],
  disabled = false,
}) => {
  const isValidPosition = (position: number): boolean => {
    return validPositions.includes(position);
  };

  const getNextPosition = (): number => {
    return section.values.findIndex((v) => v === null);
  };

  const getPreviousValue = (): number | null => {
    const nextPos = getNextPosition();
    if (nextPos <= 0) return null;
    return section.values[nextPos - 1];
  };

  const renderCell = (position: number) => {
    const value = section.values[position];
    const isFilled = value !== null;
    const isValid = isValidPosition(position);
    const isNext = position === getNextPosition();

    return (
      <TouchableOpacity
        key={position}
        style={[
          styles.cell,
          isFilled && styles.cellFilled,
          isValid && !disabled && styles.cellValid,
          isNext && !isFilled && styles.cellNext,
        ]}
        onPress={() => !disabled && isValid && onCellPress?.(position)}
        disabled={disabled || !isValid}
      >
        {isFilled ? (
          <Text style={styles.valueText}>{value}</Text>
        ) : (
          <Text style={styles.emptyText}>-</Text>
        )}
      </TouchableOpacity>
    );
  };

  const previousValue = getPreviousValue();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Purple</Text>
        <Text style={styles.score}>Score: {section.score}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cellsContainer}
      >
        {section.values.map((_, index) => renderCell(index))}
      </ScrollView>

      <View style={styles.ruleContainer}>
        <Text style={styles.ruleText}>
          {previousValue === null
            ? 'Any value allowed for first cell'
            : previousValue === 6
            ? 'After 6, any value allowed'
            : `Next value must be > ${previousValue}`}
        </Text>
      </View>

      <Text style={styles.hint}>
        Each value must be higher than previous. After 6, start fresh.
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
    color: '#8B008B',
  },
  score: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  cellsContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
  },
  cell: {
    width: 48,
    height: 60,
    backgroundColor: '#8B008B',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5B005B',
  },
  cellFilled: {
    backgroundColor: '#5B005B',
  },
  cellValid: {
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cellNext: {
    borderColor: '#DA70D6',
    borderStyle: 'dashed',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyText: {
    fontSize: 20,
    color: '#5B005B',
  },
  ruleContainer: {
    backgroundColor: '#2a2a3e',
    padding: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  ruleText: {
    color: '#DA70D6',
    fontSize: 14,
    textAlign: 'center',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

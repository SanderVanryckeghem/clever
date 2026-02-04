import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { OrangeSection as OrangeSectionType } from '../../types/game';
import { ORANGE_MULTIPLIERS } from '../../constants/scorecard';

interface Props {
  section: OrangeSectionType;
  onCellPress?: (position: number) => void;
  validPositions?: number[];
  disabled?: boolean;
}

export const OrangeSection: React.FC<Props> = ({
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

  const renderCell = (position: number) => {
    const multiplier = ORANGE_MULTIPLIERS[position];
    const value = section.values[position];
    const isFilled = value !== null;
    const isValid = isValidPosition(position);
    const isNext = position === getNextPosition();
    const hasMultiplier = multiplier > 1;

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
        {hasMultiplier && (
          <View style={styles.multiplierBadge}>
            <Text style={styles.multiplierText}>{multiplier}x</Text>
          </View>
        )}
        {isFilled ? (
          <Text style={styles.valueText}>{value}</Text>
        ) : (
          <Text style={styles.emptyText}>-</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Orange</Text>
        <Text style={styles.score}>Score: {section.score}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cellsContainer}
      >
        {ORANGE_MULTIPLIERS.map((_, index) => renderCell(index))}
      </ScrollView>

      <Text style={styles.hint}>
        Fill sequentially with any value. Some cells multiply points!
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
    color: '#FF8C00',
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
    backgroundColor: '#FF8C00',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#CC7000',
    position: 'relative',
  },
  cellFilled: {
    backgroundColor: '#CC7000',
  },
  cellValid: {
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cellNext: {
    borderColor: '#FFB84D',
    borderStyle: 'dashed',
  },
  multiplierBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#000',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  multiplierText: {
    color: '#FF8C00',
    fontSize: 10,
    fontWeight: 'bold',
  },
  valueText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  emptyText: {
    fontSize: 20,
    color: '#CC7000',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

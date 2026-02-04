import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { GreenSection as GreenSectionType } from '../../types/game';
import { GREEN_THRESHOLDS, GREEN_SCORING, GREEN_CELL_BONUSES } from '../../constants/scorecard';

interface Props {
  section: GreenSectionType;
  onCellPress?: (position: number) => void;
  validPositions?: number[];
  currentDieValue?: number;
  disabled?: boolean;
}

export const GreenSection: React.FC<Props> = ({
  section,
  onCellPress,
  validPositions = [],
  currentDieValue,
  disabled = false,
}) => {
  const isValidPosition = (position: number): boolean => {
    return validPositions.includes(position);
  };

  const getNextPosition = (): number => {
    const cells = section?.cells || [];
    return cells.findIndex((c) => !c);
  };

  const renderCell = (position: number) => {
    const threshold = GREEN_THRESHOLDS[position];
    const sectionCells = section?.cells || [];
    const isCrossed = sectionCells[position] || false;
    const isValid = isValidPosition(position);
    const isNext = position === getNextPosition();
    const hasBonus = GREEN_CELL_BONUSES[position];

    return (
      <TouchableOpacity
        key={position}
        style={[
          styles.cell,
          isCrossed && styles.cellFilled,
          isValid && !disabled && styles.cellValid,
          isNext && !isCrossed && styles.cellNext,
        ]}
        onPress={() => !disabled && isValid && onCellPress?.(position)}
        disabled={disabled || !isValid}
      >
        <Text style={styles.thresholdText}>{'>='}{threshold}</Text>
        <Text style={[styles.valueText, isCrossed && styles.crossedText]}>
          {isCrossed ? 'X' : '-'}
        </Text>
        {hasBonus && !isCrossed && (
          <Text style={styles.bonusIndicator}>
            {hasBonus.type === 'fox' ? '🦊' : hasBonus.type === 'reroll' ? '🔄' : hasBonus.type === 'plusOne' ? '+1' : '●'}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  // Calculate current score based on filled cells
  const cells = section?.cells || [];
  const filledCount = cells.filter((c) => c).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Green</Text>
        <Text style={styles.score}>Score: {section.score}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cellsContainer}
      >
        {GREEN_THRESHOLDS.map((_, index) => renderCell(index))}
      </ScrollView>

      <View style={styles.scoringRow}>
        <Text style={styles.scoringLabel}>Points:</Text>
        {GREEN_SCORING.slice(1).map((points, index) => (
          <View
            key={index}
            style={[
              styles.scoringCell,
              index < filledCount && styles.scoringCellEarned,
            ]}
          >
            <Text
              style={[
                styles.scoringText,
                index < filledCount && styles.scoringTextEarned,
              ]}
            >
              {points}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        Fill sequentially with X. Die value must be {'>='} threshold shown.
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
    color: '#228B22',
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
    backgroundColor: '#228B22',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#145214',
    position: 'relative',
  },
  cellFilled: {
    backgroundColor: '#145214',
  },
  cellValid: {
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  cellNext: {
    borderColor: '#90EE90',
    borderStyle: 'dashed',
  },
  thresholdText: {
    fontSize: 10,
    color: '#90EE90',
    marginBottom: 2,
  },
  valueText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  crossedText: {
    color: '#FFD700',
  },
  bonusIndicator: {
    fontSize: 8,
    color: '#FFD700',
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  scoringRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  scoringLabel: {
    color: '#666',
    fontSize: 12,
    marginRight: 4,
  },
  scoringCell: {
    width: 28,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    borderRadius: 4,
  },
  scoringCellEarned: {
    backgroundColor: '#228B22',
  },
  scoringText: {
    fontSize: 10,
    color: '#666',
  },
  scoringTextEarned: {
    color: '#fff',
    fontWeight: 'bold',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Scorecard } from '../../types/game';
import { Die } from '../../types/dice';
import { SectionType } from '../../hooks/useScorecard';
import {
  YELLOW_GRID_VALUES,
  BLUE_GRID_VALUES,
  GREEN_THRESHOLDS,
  ORANGE_MULTIPLIERS,
  GREEN_CELL_BONUSES,
  ORANGE_CELL_BONUSES,
  PURPLE_CELL_BONUSES,
} from '../../constants/scorecard';

interface Props {
  scorecard: Scorecard;
  selectedDie?: Die | null;
  whiteDieValue?: number;
  blueDieValue?: number;
  onMarkPosition?: (
    section: SectionType,
    position: number | { row: number; col: number }
  ) => void;
  getValidPositions?: (
    section: SectionType,
    dieValue: number,
    whiteValue?: number
  ) => (number | { row: number; col: number })[];
  onUseReroll?: () => void;
  onUsePlusOne?: () => void;
  canUseReroll?: boolean;
  canUsePlusOne?: boolean;
  disabled?: boolean;
  isOpponent?: boolean;
}

// Helper to normalize an array that may have undefined values from Firebase
const normalizeNullableArray = (arr: any, length: number): (number | null)[] => {
  const result: (number | null)[] = Array(length).fill(null);
  if (!arr) return result;
  for (let i = 0; i < length; i++) {
    const val = arr[i];
    if (typeof val === 'number') {
      result[i] = val;
    }
  }
  return result;
};

// Helper to normalize boolean array
const normalizeBooleanArray = (arr: any, length: number): boolean[] => {
  const result: boolean[] = Array(length).fill(false);
  if (!arr) return result;
  for (let i = 0; i < length; i++) {
    result[i] = arr[i] === true;
  }
  return result;
};

// Helper to normalize yellow grid (4x4)
const normalizeYellowGrid = (grid: any): boolean[][] => {
  const result: boolean[][] = [];
  for (let row = 0; row < 4; row++) {
    result[row] = [];
    for (let col = 0; col < 4; col++) {
      result[row][col] = grid?.[row]?.[col] === true;
    }
  }
  return result;
};

// Helper to normalize blue grid (3x4)
const normalizeBlueGrid = (grid: any): boolean[][] => {
  const result: boolean[][] = [];
  for (let row = 0; row < 3; row++) {
    result[row] = [];
    for (let col = 0; col < 4; col++) {
      result[row][col] = grid?.[row]?.[col] === true;
    }
  }
  return result;
};

// Normalize scorecard data (Firebase removes empty arrays/nulls)
const normalizeScorecard = (sc: Scorecard): Scorecard => ({
  yellow: {
    grid: normalizeYellowGrid(sc.yellow?.grid),
    score: sc.yellow?.score || 0,
  },
  blue: {
    grid: normalizeBlueGrid((sc.blue as any)?.grid),
    score: sc.blue?.score || 0,
  },
  green: {
    cells: normalizeBooleanArray((sc.green as any)?.cells, 11),
    score: sc.green?.score || 0,
  },
  orange: {
    values: normalizeNullableArray(sc.orange?.values, 11),
    score: sc.orange?.score || 0,
  },
  purple: {
    values: normalizeNullableArray(sc.purple?.values, 11),
    score: sc.purple?.score || 0,
  },
  bonuses: {
    rerolls: sc.bonuses?.rerolls || 0,
    plusOnes: sc.bonuses?.plusOnes || 0,
    extraDice: sc.bonuses?.extraDice || { yellow: false, blue: false, green: false, orange: false, purple: false },
    foxes: sc.bonuses?.foxes || 0,
  },
  totalScore: sc.totalScore || 0,
});

export const ScorecardContainer: React.FC<Props> = ({
  scorecard: rawScorecard,
  selectedDie,
  whiteDieValue,
  blueDieValue,
  onMarkPosition,
  getValidPositions,
  onUseReroll,
  onUsePlusOne,
  canUseReroll = false,
  canUsePlusOne = false,
  disabled = false,
  isOpponent = false,
}) => {
  const [expandedSection, setExpandedSection] = useState<SectionType | null>(null);

  // Normalize scorecard to handle Firebase's removal of empty arrays
  const scorecard = normalizeScorecard(rawScorecard);

  // Get valid positions for each section - die color must match section
  // White die can be used with blue die or on its own for any section
  const getValidForSection = (section: SectionType) => {
    if (!selectedDie || !getValidPositions || disabled || isOpponent) {
      return [];
    }

    const dieColor = selectedDie.color;

    // Check if the die color can be used for this section
    // In Ganz Schön Clever:
    // - Colored dice can only be used on their matching section
    // - White die can be used on any section (as a wild die)
    // - Blue section uses blue die + white die sum (either die can be selected)
    if (section === 'blue') {
      // Blue section uses the sum of blue + white dice
      // Can select either blue or white die
      if (dieColor === 'blue' && whiteDieValue !== undefined) {
        // Blue die selected, use white die value as the second value
        return getValidPositions(section, selectedDie.value, whiteDieValue);
      } else if (dieColor === 'white' && blueDieValue !== undefined) {
        // White die selected, use blue die value as the first value
        // The sum is the same, but we pass blue value + white value
        return getValidPositions(section, blueDieValue, selectedDie.value);
      }
      return [];
    }

    // For other sections, die color must match OR be white
    if (dieColor !== section && dieColor !== 'white') {
      return [];
    }

    return getValidPositions(section, selectedDie.value);
  };

  const yellowValid = getValidForSection('yellow') as { row: number; col: number }[];
  const blueValid = getValidForSection('blue') as { row: number; col: number }[];
  const greenValid = getValidForSection('green') as number[];
  const orangeValid = getValidForSection('orange') as number[];
  const purpleValid = getValidForSection('purple') as number[];

  const handleCellPress = (section: SectionType, position: number | { row: number; col: number }) => {
    if (!onMarkPosition || disabled || isOpponent) return;
    onMarkPosition(section, position);
    setExpandedSection(null);
  };

  // Row bonus icons for yellow (right side)
  const yellowRowBonusIcons = ['🔵', '🟠🔄', '🟢', '🦊'];
  // Column bonus icons for yellow (bottom)
  const yellowColBonusIcons = ['+1', '🔵', '🔄', '🟣'];

  // Render mini yellow grid with row/column bonuses
  const renderYellowMini = () => {
    const grid = scorecard.yellow?.grid || [[false, false, false, false], [false, false, false, false], [false, false, false, false], [false, false, false, false]];
    return (
    <View style={styles.yellowMiniGrid}>
      {[0, 1, 2, 3].map((row) => (
        <View key={row} style={styles.yellowMiniRow}>
          {[0, 1, 2, 3].map((col) => {
            const value = YELLOW_GRID_VALUES[row][col];
            const isCrossed = grid[row]?.[col];
            const isValid = yellowValid.some(p => p.row === row && p.col === col);
            const isDiagonal = value === 0;
            return (
              <TouchableOpacity
                key={col}
                style={[
                  styles.yellowMiniCell,
                  isDiagonal && styles.yellowDiagonalCell,
                  isCrossed && styles.yellowMiniCellCrossed,
                  isValid && styles.cellValid,
                ]}
                onPress={() => isValid && handleCellPress('yellow', { row, col })}
                disabled={!isValid || isDiagonal}
              >
                <Text style={[styles.yellowMiniText, isCrossed && styles.crossedText]}>
                  {isCrossed ? 'X' : (isDiagonal ? '⭐' : value)}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Row bonus indicator */}
          <View style={styles.rowBonusIndicator}>
            <Text style={styles.bonusIconText}>{yellowRowBonusIcons[row]}</Text>
          </View>
        </View>
      ))}
      {/* Column bonus indicators */}
      <View style={styles.yellowMiniRow}>
        {[0, 1, 2, 3].map((col) => (
          <View key={col} style={styles.colBonusIndicator}>
            <Text style={styles.bonusIconText}>{yellowColBonusIcons[col]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  };

  // Row bonus icons for blue (right side)
  const blueRowBonusIcons = ['🟠', '🟡', '🦊'];
  // Column bonus icons for blue (bottom)
  const blueColBonusIcons = ['🔄', '🟢', '🟣', '+1'];

  // Render blue grid (3 rows x 4 columns) with row/column bonuses
  const renderBlueMini = () => {
    const grid = scorecard.blue?.grid || [[false, false, false, false], [false, false, false, false], [false, false, false, false]];
    return (
    <View style={styles.blueGrid}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.blueGridRow}>
          {[0, 1, 2, 3].map((col) => {
            const value = BLUE_GRID_VALUES[row][col];
            // Skip empty cells (value 0)
            if (value === 0) {
              return <View key={col} style={styles.blueCellEmpty} />;
            }
            const isCrossed = grid[row]?.[col];
            const isValid = blueValid.some(p => p.row === row && p.col === col);
            return (
              <TouchableOpacity
                key={col}
                style={[
                  styles.blueCell,
                  isCrossed && styles.blueCellCrossed,
                  isValid && styles.cellValid,
                ]}
                onPress={() => isValid && handleCellPress('blue', { row, col })}
                disabled={!isValid}
              >
                <Text style={[styles.cellText, isCrossed && styles.crossedText]}>
                  {isCrossed ? 'X' : value}
                </Text>
              </TouchableOpacity>
            );
          })}
          {/* Row bonus indicator */}
          <View style={styles.rowBonusIndicator}>
            <Text style={styles.bonusIconText}>{blueRowBonusIcons[row]}</Text>
          </View>
        </View>
      ))}
      {/* Column bonus indicators */}
      <View style={styles.blueGridRow}>
        {[0, 1, 2, 3].map((col) => (
          <View key={col} style={[styles.colBonusIndicator, BLUE_GRID_VALUES[2][col] === 0 && styles.colBonusEmpty]}>
            <Text style={styles.bonusIconText}>{BLUE_GRID_VALUES[2][col] !== 0 ? blueColBonusIcons[col] : ''}</Text>
          </View>
        ))}
      </View>
    </View>
  );
  };

  // Render green row (X marks like yellow/blue)
  const renderGreenMini = () => {
    const greenCells = scorecard.green?.cells || Array(11).fill(false);
    return (
    <View style={styles.linearRow}>
      {GREEN_THRESHOLDS.map((threshold, index) => {
        const isCrossed = greenCells[index];
        const isValid = greenValid.includes(index);
        const hasBonus = GREEN_CELL_BONUSES[index];
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.greenCell,
              isCrossed && styles.greenCellFilled,
              isValid && styles.cellValid,
            ]}
            onPress={() => isValid && handleCellPress('green', index)}
            disabled={!isValid}
          >
            <Text style={styles.thresholdText}>{'>='}{threshold}</Text>
            <Text style={[styles.cellText, isCrossed && styles.crossedText]}>
              {isCrossed ? 'X' : '-'}
            </Text>
            {hasBonus && !isCrossed && (
              <Text style={styles.bonusIndicator}>
                {hasBonus.type === 'fox' ? '🦊' : hasBonus.type === 'reroll' ? '🔄' : hasBonus.type === 'plusOne' ? '+1' : '●'}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
  };

  // Render mini orange row
  const renderOrangeMini = () => {
    const orangeValues = scorecard.orange?.values || Array(11).fill(null);
    return (
    <View style={styles.linearRow}>
      {ORANGE_MULTIPLIERS.map((mult, index) => {
        const value = orangeValues[index];
        const isFilled = value !== null;
        const isValid = orangeValid.includes(index);
        const hasBonus = ORANGE_CELL_BONUSES[index];
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.orangeCell,
              isFilled && styles.orangeCellFilled,
              isValid && styles.cellValid,
            ]}
            onPress={() => isValid && handleCellPress('orange', index)}
            disabled={!isValid}
          >
            {mult > 1 && <Text style={styles.multiplierText}>{mult}x</Text>}
            <Text style={styles.cellValueText}>{isFilled ? value : '-'}</Text>
            {hasBonus && !isFilled && (
              <Text style={styles.bonusIndicator}>
                {hasBonus.type === 'fox' ? '🦊' : hasBonus.type === 'reroll' ? '🔄' : hasBonus.type === 'plusOne' ? '+1' : '●'}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
  };

  // Render mini purple row
  const renderPurpleMini = () => {
    const purpleValues = scorecard.purple?.values || Array(11).fill(null);
    return (
    <View style={styles.linearRow}>
      {purpleValues.map((value, index) => {
        const isFilled = value !== null;
        const isValid = purpleValid.includes(index);
        const hasBonus = PURPLE_CELL_BONUSES[index];
        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.purpleCell,
              isFilled && styles.purpleCellFilled,
              isValid && styles.cellValid,
            ]}
            onPress={() => isValid && handleCellPress('purple', index)}
            disabled={!isValid}
          >
            <Text style={styles.cellValueText}>{isFilled ? value : '-'}</Text>
            {hasBonus && !isFilled && (
              <Text style={styles.bonusIndicator}>
                {hasBonus.type === 'fox' ? '🦊' : hasBonus.type === 'reroll' ? '🔄' : hasBonus.type === 'plusOne' ? '+1' : '●'}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
  };

  // Render bonuses section
  const renderBonuses = () => {
    const bonuses = scorecard.bonuses || { rerolls: 0, plusOnes: 0, foxes: 0 };
    return (
    <View style={styles.bonusesRow}>
      <View style={styles.bonusItem}>
        <Text style={styles.bonusLabel}>Reroll</Text>
        <Text style={styles.bonusValue}>{bonuses.rerolls || 0}</Text>
      </View>
      <View style={styles.bonusItem}>
        <Text style={styles.bonusLabel}>+1</Text>
        <Text style={styles.bonusValue}>{bonuses.plusOnes || 0}</Text>
      </View>
      <View style={styles.bonusItem}>
        <Text style={styles.bonusLabel}>Fox</Text>
        <Text style={styles.bonusValue}>{bonuses.foxes || 0}</Text>
      </View>
    </View>
  );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {isOpponent && (
        <View style={styles.opponentBanner}>
          <Text style={styles.opponentText}>Opponent's Scorecard</Text>
        </View>
      )}

      {/* Total Score Header */}
      <View style={styles.scoreHeader}>
        <Text style={styles.totalScoreLabel}>Total Score</Text>
        <Text style={styles.totalScore}>{scorecard.totalScore || 0}</Text>
      </View>

      {/* Selected Die Indicator */}
      {selectedDie && !isOpponent && (
        <View style={styles.selectedDieContainer}>
          <Text style={styles.selectedDieLabel}>
            Using: {selectedDie.color.toUpperCase()} die = {selectedDie.value}
            {selectedDie.color === 'blue' && whiteDieValue !== undefined && ` (+ white ${whiteDieValue} = ${selectedDie.value + whiteDieValue})`}
            {selectedDie.color === 'white' && blueDieValue !== undefined && ` (+ blue ${blueDieValue} = ${selectedDie.value + blueDieValue})`}
          </Text>
        </View>
      )}

      {/* YELLOW Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.colorDot, { backgroundColor: '#FFD700' }]} />
          <Text style={styles.sectionTitle}>Yellow</Text>
          <Text style={styles.sectionScore}>{scorecard.yellow?.score || 0} pts</Text>
        </View>
        {renderYellowMini()}
      </View>

      {/* BLUE Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.colorDot, { backgroundColor: '#4169E1' }]} />
          <Text style={styles.sectionTitle}>Blue</Text>
          <Text style={styles.sectionScore}>{scorecard.blue?.score || 0} pts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderBlueMini()}
        </ScrollView>
        <Text style={styles.sectionHint}>Blue + White die sum</Text>
      </View>

      {/* GREEN Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.colorDot, { backgroundColor: '#228B22' }]} />
          <Text style={styles.sectionTitle}>Green</Text>
          <Text style={styles.sectionScore}>{scorecard.green?.score || 0} pts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderGreenMini()}
        </ScrollView>
        <Text style={styles.sectionHint}>Value must be ≥ threshold</Text>
      </View>

      {/* ORANGE Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.colorDot, { backgroundColor: '#FF8C00' }]} />
          <Text style={styles.sectionTitle}>Orange</Text>
          <Text style={styles.sectionScore}>{scorecard.orange?.score || 0} pts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderOrangeMini()}
        </ScrollView>
        <Text style={styles.sectionHint}>Any value, some cells have multipliers</Text>
      </View>

      {/* PURPLE Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.colorDot, { backgroundColor: '#8B008B' }]} />
          <Text style={styles.sectionTitle}>Purple</Text>
          <Text style={styles.sectionScore}>{scorecard.purple?.score || 0} pts</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderPurpleMini()}
        </ScrollView>
        <Text style={styles.sectionHint}>Each value must be higher than previous (reset after 6)</Text>
      </View>

      {/* Bonuses Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Bonuses</Text>
        </View>
        {renderBonuses()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 12,
    paddingBottom: 100,
  },
  opponentBanner: {
    backgroundColor: '#333',
    padding: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 12,
  },
  opponentText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    marginBottom: 12,
  },
  totalScoreLabel: {
    color: '#888',
    fontSize: 14,
  },
  totalScore: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  selectedDieContainer: {
    backgroundColor: '#3a3a4e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  selectedDieLabel: {
    color: '#00FF00',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  sectionScore: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionHint: {
    color: '#666',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },

  // Yellow grid
  yellowMiniGrid: {
    alignSelf: 'center',
  },
  yellowMiniRow: {
    flexDirection: 'row',
  },
  yellowMiniCell: {
    width: 44,
    height: 44,
    backgroundColor: '#FFD700',
    margin: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CC9900',
  },
  yellowMiniCellCrossed: {
    backgroundColor: '#8B7500',
  },
  yellowDiagonalCell: {
    backgroundColor: '#DAA520',
  },
  yellowMiniText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  // Row and column bonus indicators
  rowBonusIndicator: {
    width: 36,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  colBonusIndicator: {
    width: 44,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  colBonusEmpty: {
    opacity: 0,
  },
  bonusIconText: {
    fontSize: 12,
  },

  // Linear rows
  linearRow: {
    flexDirection: 'row',
    gap: 4,
  },

  // Blue grid (3x4)
  blueGrid: {
    alignSelf: 'center',
  },
  blueGridRow: {
    flexDirection: 'row',
  },
  blueCell: {
    width: 44,
    height: 44,
    backgroundColor: '#4169E1',
    margin: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A4B9B',
  },
  blueCellEmpty: {
    width: 44,
    height: 44,
    margin: 2,
  },
  blueCellCrossed: {
    backgroundColor: '#2A4B9B',
  },

  // Green cells
  greenCell: {
    width: 36,
    height: 44,
    backgroundColor: '#228B22',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#145214',
  },
  greenCellFilled: {
    backgroundColor: '#145214',
  },
  thresholdText: {
    fontSize: 8,
    color: '#90EE90',
  },

  // Orange cells
  orangeCell: {
    width: 36,
    height: 44,
    backgroundColor: '#FF8C00',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CC7000',
  },
  orangeCellFilled: {
    backgroundColor: '#CC7000',
  },
  multiplierText: {
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
  },

  // Purple cells
  purpleCell: {
    width: 36,
    height: 44,
    backgroundColor: '#8B008B',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5B005B',
  },
  purpleCellFilled: {
    backgroundColor: '#5B005B',
  },

  // Common cell styles
  cellText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  cellValueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  crossedText: {
    color: '#FFD700',
  },
  cellValid: {
    borderColor: '#00FF00',
    borderWidth: 3,
  },
  bonusIndicator: {
    fontSize: 8,
    color: '#FFD700',
    position: 'absolute',
    bottom: 2,
    right: 2,
  },

  // Bonuses
  bonusesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  bonusItem: {
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    minWidth: 70,
  },
  bonusLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  bonusValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

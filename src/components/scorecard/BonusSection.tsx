import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bonuses } from '../../types/game';

interface Props {
  bonuses: Bonuses;
  onUseReroll?: () => void;
  onUsePlusOne?: () => void;
  canUseReroll?: boolean;
  canUsePlusOne?: boolean;
  disabled?: boolean;
}

export const BonusSection: React.FC<Props> = ({
  bonuses,
  onUseReroll,
  onUsePlusOne,
  canUseReroll = false,
  canUsePlusOne = false,
  disabled = false,
}) => {
  const extraDiceColors = Object.entries(bonuses.extraDice)
    .filter(([_, unlocked]) => unlocked)
    .map(([color]) => color);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bonuses</Text>

      <View style={styles.bonusRow}>
        {/* Rerolls */}
        <View style={styles.bonusItem}>
          <Text style={styles.bonusLabel}>Rerolls</Text>
          <View style={styles.bonusValueContainer}>
            <Text style={styles.bonusValue}>{bonuses.rerolls}</Text>
            {bonuses.rerolls > 0 && canUseReroll && !disabled && (
              <TouchableOpacity
                style={styles.useButton}
                onPress={onUseReroll}
              >
                <Text style={styles.useButtonText}>Use</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* +1 Modifiers */}
        <View style={styles.bonusItem}>
          <Text style={styles.bonusLabel}>+1</Text>
          <View style={styles.bonusValueContainer}>
            <Text style={styles.bonusValue}>{bonuses.plusOnes}</Text>
            {bonuses.plusOnes > 0 && canUsePlusOne && !disabled && (
              <TouchableOpacity
                style={styles.useButton}
                onPress={onUsePlusOne}
              >
                <Text style={styles.useButtonText}>Use</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Foxes */}
        <View style={styles.bonusItem}>
          <Text style={styles.bonusLabel}>Foxes</Text>
          <View style={styles.foxContainer}>
            {[0, 1, 2].map((index) => (
              <Text
                key={index}
                style={[
                  styles.foxIcon,
                  index < bonuses.foxes && styles.foxEarned,
                ]}
              >
                {index < bonuses.foxes ? '🦊' : '○'}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Extra Dice */}
      {extraDiceColors.length > 0 && (
        <View style={styles.extraDiceContainer}>
          <Text style={styles.extraDiceLabel}>Extra Dice Unlocked:</Text>
          <View style={styles.extraDiceRow}>
            {extraDiceColors.map((color) => (
              <View
                key={color}
                style={[styles.extraDiceBadge, { backgroundColor: getColorHex(color) }]}
              >
                <Text style={styles.extraDiceText}>{color}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={styles.hint}>
        Foxes multiply your lowest section score at game end.
      </Text>
    </View>
  );
};

const getColorHex = (color: string): string => {
  const colors: Record<string, string> = {
    yellow: '#FFD700',
    blue: '#4169E1',
    green: '#228B22',
    orange: '#FF8C00',
    purple: '#8B008B',
  };
  return colors[color] || '#666';
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
  },
  bonusItem: {
    alignItems: 'center',
  },
  bonusLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  bonusValueContainer: {
    alignItems: 'center',
  },
  bonusValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  useButton: {
    backgroundColor: '#4169E1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  foxContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  foxIcon: {
    fontSize: 20,
    color: '#666',
  },
  foxEarned: {
    color: '#FF8C00',
  },
  extraDiceContainer: {
    marginTop: 16,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 12,
  },
  extraDiceLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  extraDiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  extraDiceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  extraDiceText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  hint: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
});

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Die as DieType } from '../types/dice';
import { DICE_COLOR_MAP, DICE_TEXT_COLOR_MAP } from '../constants/game';

interface DieProps {
  die: DieType;
  onPress?: (id: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const SIZE_MAP = {
  small: 40,
  medium: 60,
  large: 80,
};

export const Die: React.FC<DieProps> = ({
  die,
  onPress,
  disabled = false,
  size = 'medium',
}) => {
  const backgroundColor = DICE_COLOR_MAP[die.color];
  const textColor = DICE_TEXT_COLOR_MAP[die.color];
  const dimension = SIZE_MAP[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    backgroundColor,
    borderRadius: dimension * 0.15,
    opacity: disabled || die.isOnSilverTray ? 0.5 : 1,
  };

  const handlePress = () => {
    if (onPress && !disabled) {
      onPress(die.id);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.die, containerStyle]}
      onPress={handlePress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.value, { color: textColor, fontSize: dimension * 0.5 }]}>
        {die.value}
      </Text>
      {die.isSelected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  die: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  value: {
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
    borderWidth: 1,
    borderColor: '#006600',
  },
});

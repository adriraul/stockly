import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface BadgeProps {
  text: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'default',
  size = 'medium',
  style,
}) => {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${variant}Text`]]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  success: {
    backgroundColor: '#dcfce7',
  },
  warning: {
    backgroundColor: '#fef3c7',
  },
  danger: {
    backgroundColor: '#fee2e2',
  },
  info: {
    backgroundColor: '#dbeafe',
  },
  default: {
    backgroundColor: '#f3f4f6',
  },
  small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
  successText: {
    color: '#166534',
  },
  warningText: {
    color: '#92400e',
  },
  dangerText: {
    color: '#991b1b',
  },
  infoText: {
    color: '#1e40af',
  },
  defaultText: {
    color: '#374151',
  },
});

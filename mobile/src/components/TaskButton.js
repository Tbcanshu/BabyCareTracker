import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, RADIUS, SHADOWS } from '../theme';

const TaskButton = ({ config, taskKey, onPress }) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(taskKey)}
      activeOpacity={0.8}
      style={[styles.btn, { backgroundColor: config.lightBg }]}
    >
      <View style={[styles.iconBg, { backgroundColor: config.color + '55' }]}>
        <Text style={styles.emoji}>{config.emoji}</Text>
      </View>
      <Text style={[styles.label, { color: config.darkColor }]}>{config.label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: '47%',
    borderRadius: RADIUS.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default TaskButton;

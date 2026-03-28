import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { TASK_CONFIG } from '../theme';
import { formatTime, getEntrySubtitle } from '../utils/helpers';
import { deleteEntry } from '../storage';

const EntryCard = ({ entry, onDelete, onPress }) => {
  const config = TASK_CONFIG[entry.type] || {};

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEntry(entry.id);
            onDelete && onDelete(entry.id);
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, { borderLeftColor: config.darkColor || COLORS.primary }]}
    >
      {/* Emoji Badge */}
      <View style={[styles.badge, { backgroundColor: config.lightBg || COLORS.primaryLight }]}>
        <Text style={styles.emoji}>{config.emoji || '📝'}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{config.label || entry.type}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {getEntrySubtitle(entry)}
        </Text>
        {entry.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            📝 {entry.notes}
          </Text>
        ) : null}
      </View>

      {/* Time + Delete */}
      <View style={styles.right}>
        <Text style={styles.time}>{formatTime(entry.createdAt)}</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.deleteText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  badge: {
    width: 46,
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  emoji: {
    fontSize: 24,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  notes: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 8,
  },
  time: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 2,
  },
  deleteText: {
    fontSize: 12,
    color: COLORS.error,
    fontWeight: '700',
  },
});

export default EntryCard;

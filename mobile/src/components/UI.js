import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

// ─── Button ──────────────────────────────────────────────────────────────────

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}) => {
  const bgColor =
    variant === 'primary'
      ? COLORS.primary
      : variant === 'danger'
      ? COLORS.error
      : variant === 'ghost'
      ? 'transparent'
      : COLORS.surface;

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? COLORS.white
      : COLORS.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.btn,
        { backgroundColor: bgColor },
        variant === 'outline' && {
          borderWidth: 1.5,
          borderColor: COLORS.primary,
        },
        variant === 'ghost' && { paddingHorizontal: 0 },
        size === 'sm' && { paddingVertical: 8, paddingHorizontal: 16 },
        size === 'lg' && { paddingVertical: 16 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text
          style={[
            styles.btnText,
            { color: textColor },
            size === 'sm' && { fontSize: FONTS.sizes.sm },
            size === 'lg' && { fontSize: FONTS.sizes.lg },
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// ─── Card ────────────────────────────────────────────────────────────────────

export const Card = ({ children, style, onPress }) => {
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={[styles.card, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

// ─── Input ───────────────────────────────────────────────────────────────────

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  style,
  inputStyle,
}) => (
  <View style={[styles.inputWrapper, style]}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textLight}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={multiline ? 3 : 1}
      style={[
        styles.input,
        multiline && { height: 80, textAlignVertical: 'top' },
        inputStyle,
      ]}
    />
  </View>
);

// ─── Chip Select ─────────────────────────────────────────────────────────────

export const ChipSelect = ({ options, value, onChange, label }) => (
  <View style={styles.chipWrapper}>
    {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
    <View style={styles.chipRow}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
          style={[
            styles.chip,
            value === opt.value && styles.chipActive,
          ]}
        >
          <Text
            style={[
              styles.chipText,
              value === opt.value && styles.chipTextActive,
            ]}
          >
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

// ─── Section Header ──────────────────────────────────────────────────────────

export const SectionHeader = ({ title, subtitle, right }) => (
  <View style={styles.sectionHeader}>
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
    {right}
  </View>
);

// ─── Empty State ─────────────────────────────────────────────────────────────

export const EmptyState = ({ emoji, title, subtitle }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyEmoji}>{emoji || '🍼'}</Text>
    <Text style={styles.emptyTitle}>{title || 'No entries yet'}</Text>
    {subtitle ? (
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
    ) : null}
  </View>
);

// ─── Stat Badge ──────────────────────────────────────────────────────────────

export const StatBadge = ({ emoji, image, label, value, color, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    activeOpacity={0.7}
    style={[styles.statBadge, { backgroundColor: color + '22' }]}
  >
    {image ? (
      <Image source={image} style={{ width: 26, height: 26, marginBottom: 4 }} resizeMode="contain" />
    ) : (
      <Text style={styles.statEmoji}>{emoji}</Text>
    )}
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// ─── Divider ─────────────────────────────────────────────────────────────────

export const Divider = ({ style }) => (
  <View style={[styles.divider, style]} />
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  btnText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipWrapper: {
    marginBottom: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.primaryDark,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 52,
    marginBottom: SPACING.sm,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  statBadge: {
    alignItems: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    flex: 1,
    marginHorizontal: 4,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.sm,
  },
});

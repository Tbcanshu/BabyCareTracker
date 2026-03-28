import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TASK_CONFIG } from '../theme';
import { addEntry } from '../storage';
import { Button, Input, ChipSelect } from '../components/UI';

const FEED_TYPES = [
  { label: 'Breast', value: 'Breast' },
  { label: 'Formula', value: 'Formula' },
  { label: 'Mixed', value: 'Mixed' },
  { label: 'Solid', value: 'Solid' },
];

const CONSISTENCY_TYPES = [
  { label: 'Soft', value: 'Soft' },
  { label: 'Firm', value: 'Firm' },
  { label: 'Watery', value: 'Watery' },
  { label: 'Seedy', value: 'Seedy' },
];

const CRY_REASONS = [
  { label: 'Hunger', value: 'Hunger' },
  { label: 'Tired', value: 'Tired' },
  { label: 'Pain', value: 'Pain' },
  { label: 'Discomfort', value: 'Discomfort' },
  { label: 'Unknown', value: 'Unknown' },
];

const SLEEP_TYPES = [
  { label: 'Night', value: 'Night' },
  { label: 'Nap', value: 'Nap' },
  { label: 'Car Nap', value: 'Car Nap' },
  { label: 'Stroller', value: 'Stroller' },
];

const BATH_TYPES = [
  { label: 'Full Bath', value: 'Full Bath' },
  { label: 'Quick Shower', value: 'Quick Shower' },
  { label: 'Sponge Bath', value: 'Sponge Bath' },
];

const AddEntryScreen = ({ navigation, route }) => {
  const { type } = route.params || {};
  const config = TASK_CONFIG[type] || {};

  const [form, setForm] = useState({
    amount_ml: '',
    feed_type: '',
    duration_min: '',
    notes: '',
    consistency: '',
    reason: '',
    sleep_type: '',
    bath_type: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    if (!type) {
      Alert.alert('Error', 'No task type selected');
      return;
    }

    setLoading(true);
    const entry = { type, ...form };

    // Clean up empty fields
    Object.keys(entry).forEach((k) => {
      if (entry[k] === '') delete entry[k];
    });

    const saved = await addEntry(entry);
    setLoading(false);

    if (saved) {
      Alert.alert('Saved! ✅', `${config.label} logged successfully.`, [
        { text: 'Log Another', onPress: () => setForm({ amount_ml: '', feed_type: '', duration_min: '', notes: '', consistency: '', reason: '', sleep_type: '', bath_type: '' }) },
        { text: 'Done', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', 'Could not save entry. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={[styles.headerCard, { backgroundColor: config.lightBg || COLORS.primaryLight }]}>
          <Text style={styles.headerEmoji}>{config.emoji || '📝'}</Text>
          <View>
            <Text style={[styles.headerTitle, { color: config.darkColor || COLORS.primaryDark }]}>
              {config.label || type}
            </Text>
            <Text style={styles.headerSub}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* ── Milk Feed Fields ── */}
        {type === 'milk' && (
          <>
            <Input
              label="Amount (ml)"
              value={form.amount_ml}
              onChangeText={(v) => update('amount_ml', v)}
              placeholder="e.g. 120"
              keyboardType="numeric"
            />
            <Input
              label="Duration (minutes)"
              value={form.duration_min}
              onChangeText={(v) => update('duration_min', v)}
              placeholder="e.g. 15"
              keyboardType="numeric"
            />
            <ChipSelect
              label="Feed Type"
              options={FEED_TYPES}
              value={form.feed_type}
              onChange={(v) => update('feed_type', v)}
            />
          </>
        )}

        {/* ── Poop Fields ── */}
        {type === 'poop' && (
          <ChipSelect
            label="Consistency"
            options={CONSISTENCY_TYPES}
            value={form.consistency}
            onChange={(v) => update('consistency', v)}
          />
        )}

        {/* ── Cry Fields ── */}
        {type === 'cry' && (
          <>
            <Input
              label="Duration (minutes)"
              value={form.duration_min}
              onChangeText={(v) => update('duration_min', v)}
              placeholder="e.g. 10"
              keyboardType="numeric"
            />
            <ChipSelect
              label="Possible Reason"
              options={CRY_REASONS}
              value={form.reason}
              onChange={(v) => update('reason', v)}
            />
          </>
        )}

        {/* ── Sleep Fields ── */}
        {type === 'sleep' && (
          <>
            <Input
              label="Duration (minutes)"
              value={form.duration_min}
              onChangeText={(v) => update('duration_min', v)}
              placeholder="e.g. 90"
              keyboardType="numeric"
            />
            <ChipSelect
              label="Sleep Type"
              options={SLEEP_TYPES}
              value={form.sleep_type}
              onChange={(v) => update('sleep_type', v)}
            />
          </>
        )}

        {/* ── Shower Fields ── */}
        {type === 'shower' && (
          <ChipSelect
            label="Bath Type"
            options={BATH_TYPES}
            value={form.bath_type}
            onChange={(v) => update('bath_type', v)}
          />
        )}

        {/* Notes – always shown */}
        <Input
          label="Notes (optional)"
          value={form.notes}
          onChangeText={(v) => update('notes', v)}
          placeholder="Any observations..."
          multiline
        />

        {/* Save Button */}
        <Button
          title={`Save ${config.label || 'Entry'}`}
          onPress={handleSave}
          loading={loading}
          size="lg"
          style={styles.saveBtn}
        />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  headerEmoji: {
    fontSize: 42,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    marginTop: SPACING.sm,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.sm,
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
});

export default AddEntryScreen;

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
  TextInput,
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
    amount_oz: '',
    feed_type: '',
    duration_min: '',
    notes: '',
    consistency: '',
    reason: '',
    sleep_type: '',
    bath_type: '',
    sleep_start: '',
    sleep_end: '',
  });
  const [showReminder, setShowReminder] = useState(false);
  const [reminderData, setReminderData] = useState({
    interval: '3',
    unit: 'hours', // 'hours' or 'minutes'
  });
  const [loading, setLoading] = useState(false);

  const update = (key, val) => {
    setForm((f) => {
      const newForm = { ...f, [key]: val };
      // Auto-calculate sleep duration
      if (key === 'sleep_start' || key === 'sleep_end') {
        const start = newForm.sleep_start;
        const end = newForm.sleep_end;
        if (start && end && /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(end)) {
          const [h1, m1] = start.split(':').map(Number);
          const [h2, m2] = end.split(':').map(Number);
          let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
          if (diff < 0) diff += 24 * 60; // Crosses midnight
          newForm.duration_min = String(diff);
        }
      }
      return newForm;
    });
  };

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

    if (saved && showReminder) {
      const { saveReminder, generateId } = require('../storage/remindersStorage');
      const intervalHours = reminderData.unit === 'hours' 
        ? Number(reminderData.interval) 
        : Number(reminderData.interval) / 60;
      
      await saveReminder({
        id: generateId(),
        activityKey: type,
        label: config.label || type,
        emoji: config.emoji || '🔔',
        color: config.darkColor || COLORS.primary,
        lightBg: config.lightBg || COLORS.primaryLight,
        type: 'interval',
        intervalHours,
        message: `Time for ${config.label || type}!`,
      });
    }

    setLoading(false);

    if (saved) {
      Alert.alert('Saved! ✅', `${config.label} logged successfully.`, [
        { text: 'Log Another', onPress: () => setForm({ amount_oz: '', feed_type: '', duration_min: '', notes: '', consistency: '', reason: '', sleep_type: '', bath_type: '', sleep_start: '', sleep_end: '' }) },
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
              label="Amount (oz)"
              value={form.amount_oz}
              onChangeText={(v) => update('amount_oz', v)}
              placeholder="e.g. 4.0"
              keyboardType="decimal-pad"
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
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="Start Time"
                  value={form.sleep_start}
                  onChangeText={(v) => update('sleep_start', v)}
                  placeholder="22:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Wake Up"
                  value={form.sleep_end}
                  onChangeText={(v) => update('sleep_end', v)}
                  placeholder="07:30"
                />
              </View>
            </View>
            <Input
              label="Total Duration (min)"
              value={form.duration_min}
              onChangeText={(v) => update('duration_min', v)}
              placeholder="Auto-calculated"
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

        {/* Reminder Section */}
        <View style={styles.reminderSection}>
          <TouchableOpacity 
            style={styles.reminderToggle} 
            onPress={async () => {
              if (!showReminder) {
                const { requestNotificationPermissions } = require('../storage/remindersStorage');
                const granted = await requestNotificationPermissions();
                if (!granted) {
                  Alert.alert('Permission Needed', 'Please enable notifications in settings to use reminders.');
                  return;
                }
              }
              setShowReminder(!showReminder);
            }}
          >
            <Text style={styles.reminderToggleText}>
              {showReminder ? '🔔 Set Reminder: ON' : '🔕 Add Reminder?'}
            </Text>
            <Text style={{ fontSize: 20 }}>{showReminder ? '✅' : '➕'}</Text>
          </TouchableOpacity>
          
          {showReminder && (
            <View style={styles.reminderBox}>
              <Text style={styles.reminderLabel}>Remind me again in:</Text>
              <View style={styles.reminderRow}>
                <TextInput
                  style={styles.reminderInput}
                  value={reminderData.interval}
                  onChangeText={(v) => setReminderData({ ...reminderData, interval: v })}
                  keyboardType="numeric"
                />
                <TouchableOpacity 
                  onPress={() => setReminderData({ ...reminderData, unit: reminderData.unit === 'hours' ? 'minutes' : 'hours' })}
                  style={styles.unitBtn}
                >
                  <Text style={styles.unitBtnText}>{reminderData.unit}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

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
  reminderSection: {
    marginVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reminderToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  reminderToggleText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  reminderBox: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.xs,
  },
  reminderLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 70,
    textAlign: 'center',
  },
  unitBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  unitBtnText: {
    color: COLORS.primaryDark,
    fontWeight: '700',
    fontSize: FONTS.sizes.sm,
  },
});

export default AddEntryScreen;

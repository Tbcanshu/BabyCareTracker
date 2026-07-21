import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getAllReminders,
  saveReminder,
  toggleReminder,
  deleteReminder,
  requestNotificationPermissions,
  generateId,
} from "../storage/remindersStorage";

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#FFF8FB",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF0F6",
  primary: "#E8A0BF",
  primaryDark: "#C76B9A",
  primaryLight: "#F5D0E5",
  text: "#3A2140",
  textSec: "#7A5F85",
  textLight: "#B8A0C0",
  border: "#F0E0F0",
  white: "#FFFFFF",
  error: "#E85C7A",
  green: "#3DC99A",
  greenLight: "#EDFDF6",
  orange: "#F0A060",
  orangeLight: "#FFF6EE",
  blue: "#5B8FD9",
  blueLight: "#EEF5FF",
  purple: "#7B65E8",
  purpleLight: "#F3F0FF",
  yellow: "#E8C835",
  yellowLight: "#FFFDE8",
  teal: "#00897B",
  tealLight: "#E0F2F1",
};

// ─── Activity definitions ─────────────────────────────────────────────────────
const ACTIVITIES = [
  {
    key: "milk",
    label: "Milk Feed",
    emoji: "🍼",
    color: C.orange,
    lightBg: C.orangeLight,
    defaultInterval: 3,
    defaultMsg: "Time to feed the baby! 🍼",
  },
  {
    key: "diaper",
    label: "Diaper Change",
    emoji: "💧",
    color: C.yellow,
    lightBg: C.yellowLight,
    defaultInterval: 2,
    defaultMsg: "Time to check the diaper! 💧",
  },
  {
    key: "sleep",
    label: "Sleep Time",
    emoji: "😴",
    color: C.purple,
    lightBg: C.purpleLight,
    defaultInterval: 4,
    defaultMsg: "Baby's sleep time! 😴",
  },
  {
    key: "shower",
    label: "Bath / Shower",
    emoji: "🛁",
    color: C.blue,
    lightBg: C.blueLight,
    defaultInterval: 24,
    defaultMsg: "Bath time for baby! 🛁",
  },
  {
    key: "medicine",
    label: "Medicine",
    emoji: "💊",
    color: C.error,
    lightBg: "#FFF0F3",
    defaultInterval: 8,
    defaultMsg: "Time for baby's medicine! 💊",
  },
  {
    key: "vaccine",
    label: "Vaccination",
    emoji: "💉",
    color: C.teal,
    lightBg: C.tealLight,
    defaultInterval: 168,
    defaultMsg: "Vaccination appointment reminder! 💉",
  },
  {
    key: "cry",
    label: "Check on Baby",
    emoji: "👶",
    color: C.green,
    lightBg: C.greenLight,
    defaultInterval: 1,
    defaultMsg: "Time to check on baby! 👶",
  },
];

const RemindersScreen = () => {
  const insets = useSafeAreaInsets();
  const [reminders, setReminders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Form state
  const [selectedActivity, setSelectedActivity] = useState(ACTIVITIES[0]);
  const [reminderType, setReminderType] = useState("interval"); // 'interval' | 'time'
  const [intervalHours, setIntervalHours] = useState("3");
  const [intervalUnit, setIntervalUnit] = useState("hours"); // "hours" | "minutes"
  const [customTime, setCustomTime] = useState("08:00");
  const [customMessage, setCustomMessage] = useState("");

  const loadData = async () => {
    const granted = await requestNotificationPermissions();
    setPermissionGranted(granted);
    const data = await getAllReminders();
    setReminders(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const handleAdd = async () => {
    if (!permissionGranted) {
      Alert.alert(
        "Permission Required",
        "Please allow notifications in your device settings to use reminders.",
        [{ text: "OK" }],
      );
      return;
    }

    if (reminderType === "interval") {
      if (!intervalHours || isNaN(intervalHours) || Number(intervalHours) <= 0) {
        Alert.alert("Invalid", "Please enter a valid number.");
        return;
      }
      const intervalInMinutes = intervalUnit === "hours" ? Number(intervalHours) * 60 : Number(intervalHours);
      if (intervalInMinutes < 15) {
        Alert.alert("Invalid Interval", "Repeating reminders must be at least 15 minutes apart due to system battery-saving limitations.");
        return;
      }
    }

    if (reminderType === "time" && !/^\d{2}:\d{2}$/.test(customTime)) {
      Alert.alert("Invalid", "Please enter time in HH:MM format (e.g. 08:00)");
      return;
    }

    const reminder = {
      id: generateId(),
      activityKey: selectedActivity.key,
      label: selectedActivity.label,
      emoji: selectedActivity.emoji,
      color: selectedActivity.color,
      lightBg: selectedActivity.lightBg,
      type: reminderType,
      intervalHours: intervalUnit === "hours" ? Number(intervalHours) : Number(intervalHours) / 60,
      intervalValue: Number(intervalHours),
      intervalUnit: intervalUnit,
      time: customTime,
      message: customMessage || selectedActivity.defaultMsg,
    };

    const saved = await saveReminder(reminder);
    if (saved) {
      setModalVisible(false);
      resetForm();
      await loadData();
      Alert.alert(
        "✅ Reminder Set!",
        `You'll be notified for ${selectedActivity.label}.`,
      );
    } else {
      Alert.alert("Error", "Could not set reminder. Please try again.");
    }
  };

  const handleToggle = async (id) => {
    const updated = await toggleReminder(id);
    setReminders(updated);
  };

  const handleDelete = (id) => {
    Alert.alert("Delete Reminder", "Remove this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = await deleteReminder(id);
          setReminders(updated);
        },
      },
    ]);
  };

  const resetForm = () => {
    setSelectedActivity(ACTIVITIES[0]);
    setReminderType("interval");
    setIntervalHours("3");
    setCustomTime("08:00");
    setCustomMessage("");
  };

  const activeCount = reminders.filter((r) => r.active).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Warning */}
        {!permissionGranted && (
          <View style={styles.permWarning}>
            <Text style={styles.permWarningText}>
              ⚠️ Notification permission not granted. Reminders won't work until
              you allow notifications in Settings.
            </Text>
          </View>
        )}

        {/* Header Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{reminders.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: C.green }]}>
              {activeCount}
            </Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: C.textLight }]}>
              {reminders.length - activeCount}
            </Text>
            <Text style={styles.statLabel}>Paused</Text>
          </View>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>＋ Add Reminder</Text>
        </TouchableOpacity>

        {/* Reminders List */}
        {reminders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>No reminders yet</Text>
            <Text style={styles.emptySub}>
              Tap "Add Reminder" to set up alerts for feeding, diaper changes
              and more
            </Text>
          </View>
        ) : (
          reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={() => handleToggle(reminder.id)}
              onDelete={() => handleDelete(reminder.id)}
            />
          ))
        )}

        {/* Quick Setup Section */}
        <Text style={styles.sectionTitle}>⚡ Quick Setup</Text>
        <Text style={styles.sectionSub}>
          Tap an activity to quickly add a default reminder
        </Text>
        <View style={styles.quickGrid}>
          {ACTIVITIES.map((act) => (
            <TouchableOpacity
              key={act.key}
              style={[styles.quickCard, { backgroundColor: act.lightBg }]}
              onPress={() => {
                setSelectedActivity(act);
                setIntervalHours(String(act.defaultInterval));
                setCustomMessage(act.defaultMsg);
                // Vaccination defaults to time-based
                if (act.key === "vaccine") setReminderType("time");
                else setReminderType("interval");
                setModalVisible(true);
              }}
            >
              <Text style={styles.quickEmoji}>{act.emoji}</Text>
              <Text style={[styles.quickLabel, { color: act.color }]}>
                {act.label}
              </Text>
              <Text style={styles.quickInterval}>
                {act.key === "vaccine"
                  ? "Set date"
                  : act.defaultInterval >= 24
                    ? `Every ${act.defaultInterval / 24}d`
                    : `Every ${act.defaultInterval}h`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* ── ADD REMINDER MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>🔔 New Reminder</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {/* Activity Picker */}
                <Text style={styles.fieldLabel}>Activity</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.activityScroll}
                  nestedScrollEnabled
                >
                  {ACTIVITIES.map((act) => (
                    <TouchableOpacity
                      key={act.key}
                      onPress={() => {
                        setSelectedActivity(act);
                        setIntervalHours(String(act.defaultInterval));
                        // Always update the message to match the newly selected activity
                        setCustomMessage(act.defaultMsg);
                        if (act.key === "vaccine") setReminderType("time");
                        else setReminderType("interval");
                      }}
                      style={[
                        styles.activityChip,
                        selectedActivity.key === act.key && {
                          backgroundColor: act.lightBg,
                          borderColor: act.color,
                        },
                      ]}
                    >
                      <Text style={styles.activityChipEmoji}>{act.emoji}</Text>
                      <Text
                        style={[
                          styles.activityChipLabel,
                          selectedActivity.key === act.key && { color: act.color },
                        ]}
                      >
                        {act.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Reminder Type Toggle */}
                <Text style={styles.fieldLabel}>Reminder Type</Text>
                <View style={styles.typeToggle}>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      reminderType === "interval" && styles.typeBtnActive,
                    ]}
                    onPress={() => setReminderType("interval")}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        reminderType === "interval" && styles.typeBtnTextActive,
                      ]}
                    >
                      🔁 Repeat Every
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.typeBtn,
                      reminderType === "time" && styles.typeBtnActive,
                    ]}
                    onPress={() => setReminderType("time")}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        reminderType === "time" && styles.typeBtnTextActive,
                      ]}
                    >
                      🕐 Daily at Time
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Interval Input */}
                {reminderType === "interval" && (
                  <View style={styles.intervalRow}>
                    <Text style={styles.intervalLabel}>Every</Text>
                    <TextInput
                      style={styles.intervalInput}
                      value={intervalHours}
                      onChangeText={setIntervalHours}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <TouchableOpacity
                      onPress={() => setIntervalUnit(intervalUnit === "hours" ? "minutes" : "hours")}
                      style={styles.unitToggleBtn}
                    >
                      <Text style={styles.unitToggleBtnText}>{intervalUnit}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Time Input */}
                {reminderType === "time" && (
                  <>
                    <Text style={styles.fieldLabel}>
                      Time (HH:MM — 24hr format)
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={customTime}
                      onChangeText={setCustomTime}
                      placeholder="e.g. 08:00 or 14:30"
                      placeholderTextColor={C.textLight}
                      keyboardType="numbers-and-punctuation"
                    />
                    {selectedActivity.key === "vaccine" && (
                      <View style={styles.vaccineNote}>
                        <Text style={styles.vaccineNoteText}>
                          💉 Tip: Set the appointment time. You'll get a daily
                          reminder at this time — turn it off after the visit.
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Custom Message */}
                <Text style={styles.fieldLabel}>Notification Message</Text>
                <TextInput
                  style={styles.input}
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  placeholder={selectedActivity.defaultMsg}
                  placeholderTextColor={C.textLight}
                />

                {/* Buttons */}
                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => {
                      setModalVisible(false);
                      resetForm();
                    }}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalBtn,
                      { backgroundColor: selectedActivity.color },
                    ]}
                    onPress={handleAdd}
                  >
                    <Text style={styles.modalBtnSaveText}>Set Reminder</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

// ─── Reminder Card ────────────────────────────────────────────────────────────
const ReminderCard = ({ reminder, onToggle, onDelete }) => (
  <View
    style={[
      styles.reminderCard,
      { borderLeftColor: reminder.color || "#E8A0BF" },
    ]}
  >
    <View
      style={[
        styles.reminderBadge,
        { backgroundColor: reminder.lightBg || "#FFF0F6" },
      ]}
    >
      <Text style={styles.reminderEmoji}>{reminder.emoji}</Text>
    </View>
    <View style={styles.reminderInfo}>
      <Text style={styles.reminderLabel}>{reminder.label}</Text>
      <Text style={styles.reminderDetail}>
        {reminder.type === "interval"
          ? `🔁 Every ${reminder.intervalValue || reminder.intervalHours}${reminder.intervalUnit || 'h'}`
          : `🕐 Daily at ${reminder.time}`}
      </Text>
      <Text style={styles.reminderMsg} numberOfLines={1}>
        "{reminder.message}"
      </Text>
    </View>
    <View style={styles.reminderActions}>
      <Switch
        value={reminder.active}
        onValueChange={onToggle}
        trackColor={{ false: "#E0D0E8", true: "#3DC99A" }}
        thumbColor={reminder.active ? "#fff" : "#f4f3f4"}
      />
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },

  permWarning: {
    backgroundColor: "#FFF3CD",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#F0A060",
  },
  permWarningText: { fontSize: 13, color: "#7A5F00", fontWeight: "500" },

  statsCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#E8A0BF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 28, fontWeight: "800", color: C.text },
  statLabel: {
    fontSize: 12,
    color: C.textSec,
    marginTop: 2,
    fontWeight: "500",
  },
  statDivider: { width: 1, backgroundColor: C.border },

  addBtn: {
    backgroundColor: C.primaryDark,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
    elevation: 4,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addBtnText: { color: C.white, fontSize: 16, fontWeight: "700" },

  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  emptySub: {
    fontSize: 14,
    color: C.textSec,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },

  reminderCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    gap: 12,
  },
  reminderBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderEmoji: { fontSize: 26 },
  reminderInfo: { flex: 1 },
  reminderLabel: { fontSize: 15, fontWeight: "700", color: C.text },
  reminderDetail: {
    fontSize: 12,
    color: C.textSec,
    marginTop: 2,
    fontWeight: "600",
  },
  reminderMsg: {
    fontSize: 11,
    color: C.textLight,
    marginTop: 3,
    fontStyle: "italic",
  },
  reminderActions: { alignItems: "center", gap: 6 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionSub: { fontSize: 13, color: C.textSec, marginBottom: 12 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    elevation: 2,
  },
  quickEmoji: { fontSize: 28, marginBottom: 6 },
  quickLabel: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  quickInterval: { fontSize: 11, color: C.textSec, marginTop: 3 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.text,
    marginBottom: 20,
    textAlign: "center",
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.textSec,
    marginBottom: 8,
  },

  activityScroll: { marginBottom: 16 },
  activityChip: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surfaceAlt,
    padding: 10,
    marginRight: 8,
    minWidth: 72,
  },
  activityChipEmoji: { fontSize: 22, marginBottom: 4 },
  activityChipLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textSec,
    textAlign: "center",
  },

  typeToggle: { flexDirection: "row", gap: 8, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  typeBtnActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primaryDark,
  },
  typeBtnText: { fontSize: 13, fontWeight: "600", color: C.textSec },
  typeBtnTextActive: { color: C.primaryDark },

  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  intervalLabel: { fontSize: 15, fontWeight: "600", color: C.text },
  intervalInput: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 20,
    fontWeight: "800",
    color: C.primaryDark,
    borderWidth: 1.5,
    borderColor: C.border,
    textAlign: "center",
    width: 80,
  },

  input: {
    backgroundColor: C.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 14,
  },

  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  modalBtnCancel: { backgroundColor: C.surfaceAlt },
  modalBtnCancelText: { color: C.textSec, fontWeight: "700" },
  modalBtnSaveText: { color: C.white, fontWeight: "700", fontSize: 15 },
  vaccineNote: {
    backgroundColor: "#E0F2F1",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#00897B",
  },
  vaccineNoteText: { fontSize: 12, color: "#00574B", lineHeight: 18 },
  unitToggleBtn: {
    backgroundColor: C.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.primaryDark,
  },
  unitToggleBtnText: {
    color: C.primaryDark,
    fontWeight: "700",
    fontSize: 14,
  },
});

export default RemindersScreen;

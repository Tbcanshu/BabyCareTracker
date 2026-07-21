import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { clamp } from "../utils/responsive";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { format, parseISO } from "date-fns";
import {
  getAllPhotos,
  addPhoto,
  deletePhoto,
  getAllMeasurements,
  addMeasurement,
  deleteMeasurement,
  getAllMilestones,
  toggleMilestone,
  groupPhotosByMonth,
} from "../storage/growthStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Theme (inline to avoid import issues) ───────────────────────────────────
const C = {
  bg: "#FFF8FB",
  surface: "#FFFFFF",
  surfaceAlt: "#FFF0F6",
  primary: "#E8A0BF",
  primaryDark: "#C76B9A",
  primaryLight: "#F5D0E5",
  accent: "#BAD7E9",
  accentDark: "#7DB9D9",
  green: "#3DC99A",
  greenLight: "#EDFDF6",
  purple: "#7B65E8",
  purpleLight: "#F3F0FF",
  orange: "#F0A060",
  orangeLight: "#FFF6EE",
  text: "#3A2140",
  textSec: "#7A5F85",
  textLight: "#B8A0C0",
  border: "#F0E0F0",
  white: "#FFFFFF",
  error: "#E85C7A",
};

// ─── Milestone definitions ────────────────────────────────────────────────────
const MILESTONES = [
  { key: "first_smile", emoji: "😊", label: "First Smile", age: "~6 weeks" },
  { key: "holds_head", emoji: "💪", label: "Holds Head Up", age: "~2 months" },
  { key: "first_laugh", emoji: "😂", label: "First Laugh", age: "~3-4 months" },
  { key: "rolls_over", emoji: "🔄", label: "Rolls Over", age: "~4-5 months" },
  { key: "sits_alone", emoji: "🧸", label: "Sits Alone", age: "~6 months" },
  { key: "first_tooth", emoji: "🦷", label: "First Tooth", age: "~6-8 months" },
  {
    key: "first_food",
    emoji: "🥣",
    label: "First Solid Food",
    age: "~6 months",
  },
  {
    key: "crawling",
    emoji: "🐣",
    label: "Starts Crawling",
    age: "~7-9 months",
  },
  { key: "waves_bye", emoji: "👋", label: "Waves Bye Bye", age: "~9 months" },
  { key: "first_word", emoji: "💬", label: "First Word", age: "~12 months" },
  { key: "first_steps", emoji: "👣", label: "First Steps", age: "~12 months" },
  {
    key: "first_birthday",
    emoji: "🎂",
    label: "First Birthday",
    age: "12 months",
  },
];

const formatMonthLabel = (key) => {
  const [year, month] = key.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return format(date, "MMMM yyyy");
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const GrowthScreen = () => {
  const insets = useSafeAreaInsets();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const photoViewSize = clamp(Math.min(winWidth, winHeight) * 0.85, 200, 600);
  const [weightChartWidth, setWeightChartWidth] = useState(0);
  const [heightChartWidth, setHeightChartWidth] = useState(0);
  const [activeTab, setActiveTab] = useState("timeline");
  const [photos, setPhotos] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [groupedPhotos, setGroupedPhotos] = useState({});

  // Modals
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [measureModalVisible, setMeasureModalVisible] = useState(false);
  const [viewPhotoVisible, setViewPhotoVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Form state
  const [newPhotoUri, setNewPhotoUri] = useState(null);
  const [newCaption, setNewCaption] = useState("");
  const [newPhotoDate, setNewPhotoDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newWeight, setNewWeight] = useState("");
  const [newWeightOz, setNewWeightOz] = useState("");
  const [newHeight, setNewHeight] = useState("");
  const [newMeasureDate, setNewMeasureDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newMeasureNote, setNewMeasureNote] = useState("");

  const loadData = async () => {
    const [p, m, ms] = await Promise.all([
      getAllPhotos(),
      getAllMeasurements(),
      getAllMilestones(),
    ]);
    setPhotos(p);
    setMeasurements(m);
    setMilestones(ms);
    setGroupedPhotos(groupPhotosByMonth(p));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  // ── Photo Picker ────────────────────────────────────────────────────────────
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow access to your photo library.",
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setNewPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setNewPhotoUri(result.assets[0].uri);
    }
  };

  const handleSavePhoto = async () => {
    if (!newPhotoUri) {
      Alert.alert("No photo", "Please select or take a photo first.");
      return;
    }
    await addPhoto({
      uri: newPhotoUri,
      caption: newCaption,
      takenAt: newPhotoDate + "T00:00:00.000Z",
    });
    setPhotoModalVisible(false);
    setNewPhotoUri(null);
    setNewCaption("");
    setNewPhotoDate(new Date().toISOString().split("T")[0]);
    await loadData();
  };

  const handleDeletePhoto = (id) => {
    Alert.alert("Delete Photo", "Remove this photo from the timeline?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deletePhoto(id);
          setViewPhotoVisible(false);
          await loadData();
        },
      },
    ]);
  };

  const handleSaveMeasurement = async () => {
    if (!newWeight && !newHeight) {
      Alert.alert("Empty", "Please enter at least weight or height.");
      return;
    }
    await addMeasurement({
      weight_lbs: newWeight,
      weight_oz: newWeightOz,
      height_in: newHeight,
      measuredAt: newMeasureDate + "T00:00:00.000Z",
      notes: newMeasureNote,
    });
    setMeasureModalVisible(false);
    setNewWeight("");
    setNewWeightOz("");
    setNewHeight("");
    setNewMeasureNote("");
    setNewMeasureDate(new Date().toISOString().split("T")[0]);
    await loadData();
  };

  const handleToggleMilestone = async (key) => {
    const updated = await toggleMilestone(key);
    setMilestones(updated);
  };

  const isMilestoneAchieved = (key) => milestones.some((m) => m.key === key);

  // ── Tabs ────────────────────────────────────────────────────────────────────
  const tabs = [
    { key: "timeline", label: "📸 Timeline" },
    { key: "measurements", label: "📏 Growth" },
    { key: "milestones", label: "🏆 Milestones" },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TIMELINE TAB ── */}
      {activeTab === "timeline" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Add Photo Button */}
          <TouchableOpacity
            style={styles.addPhotoBtn}
            onPress={() => setPhotoModalVisible(true)}
          >
            <Text style={styles.addPhotoBtnText}>📸 Add Photo</Text>
          </TouchableOpacity>

          {Object.keys(groupedPhotos).length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📷</Text>
              <Text style={styles.emptyTitle}>No photos yet</Text>
              <Text style={styles.emptySub}>
                Tap "Add Photo" to start your baby's timeline
              </Text>
            </View>
          ) : (
            Object.keys(groupedPhotos)
              .sort((a, b) => b.localeCompare(a))
              .map((monthKey) => (
                <View key={monthKey} style={styles.monthGroup}>
                  <View style={styles.monthLabelRow}>
                    <View style={styles.monthLine} />
                    <Text style={styles.monthLabel}>
                      {formatMonthLabel(monthKey)}
                    </Text>
                    <View style={styles.monthLine} />
                  </View>
                  <View style={styles.photoGrid}>
                    {groupedPhotos[monthKey].map((photo) => (
                      <TouchableOpacity
                        key={photo.id}
                        style={styles.photoThumb}
                        onPress={() => {
                          setSelectedPhoto(photo);
                          setViewPhotoVisible(true);
                        }}
                      >
                        <Image
                          source={{ uri: photo.uri }}
                          style={styles.photoImg}
                        />
                        {photo.caption ? (
                          <Text style={styles.photoCaption} numberOfLines={1}>
                            {photo.caption}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))
          )}
        </ScrollView>
      )}

      {/* ── MEASUREMENTS TAB ── */}
      {activeTab === "measurements" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.addPhotoBtn}
            onPress={() => setMeasureModalVisible(true)}
          >
            <Text style={styles.addPhotoBtnText}>📏 Log Measurement</Text>
          </TouchableOpacity>

          {/* Latest stats */}
          {measurements.length > 0 && (
            <View style={styles.latestCard}>
              <Text style={styles.latestTitle}>Latest Measurements</Text>
              <View style={styles.latestRow}>
            {measurements[0].weight_lbs ? (
                  <View
                    style={[
                      styles.latestStat,
                      { backgroundColor: C.orangeLight },
                    ]}
                  >
                    <Text style={styles.latestEmoji}>⚖️</Text>
                    <Text style={[styles.latestValue, { color: C.orange }]}>
                      {measurements[0].weight_lbs} lbs {measurements[0].weight_oz || 0} oz
                    </Text>
                    <Text style={styles.latestLabel}>Weight</Text>
                  </View>
                ) : null}
                {measurements[0].height_in ? (
                  <View
                    style={[
                      styles.latestStat,
                      { backgroundColor: C.purpleLight },
                    ]}
                  >
                    <Text style={styles.latestEmoji}>📏</Text>
                    <Text style={[styles.latestValue, { color: C.purple }]}>
                      {measurements[0].height_in} in
                    </Text>
                    <Text style={styles.latestLabel}>Height</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}

          {/* Simple weight chart */}
          {measurements.filter((m) => m.weight_lbs).length > 1 && (
            <View
              style={styles.chartCard}
              onLayout={(e) => setWeightChartWidth(e.nativeEvent.layout.width)}
            >
              <Text style={styles.chartTitle}>⚖️ Weight Over Time (lbs)</Text>
              <SimpleLineChart
                data={measurements
                  .filter((m) => m.weight_lbs)
                  .slice(0, 8)
                  .reverse()
                  .map((m) => ({
                    value: parseFloat(m.weight_lbs) + (parseFloat(m.weight_oz || 0) / 16),
                    label: format(
                      new Date(m.measuredAt || m.createdAt),
                      "MM-dd",
                    ),
                  }))}
                color={C.orange}
                containerWidth={weightChartWidth}
              />
            </View>
          )}

          {/* Height chart */}
          {measurements.filter((m) => m.height_in).length > 1 && (
            <View
              style={styles.chartCard}
              onLayout={(e) => setHeightChartWidth(e.nativeEvent.layout.width)}
            >
              <Text style={styles.chartTitle}>📏 Height Over Time (in)</Text>
              <SimpleLineChart
                data={measurements
                  .filter((m) => m.height_in)
                  .slice(0, 8)
                  .reverse()
                  .map((m) => ({
                    value: parseFloat(m.height_in),
                    label: format(
                      new Date(m.measuredAt || m.createdAt),
                      "MM-dd",
                    ),
                  }))}
                color={C.purple}
              />
            </View>
          )}

          {/* Measurement list */}
          {measurements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📏</Text>
              <Text style={styles.emptyTitle}>No measurements yet</Text>
              <Text style={styles.emptySub}>
                Log height and weight to track growth
              </Text>
            </View>
          ) : (
            measurements.map((m) => (
              <View key={m.id} style={styles.measureCard}>
                <View style={styles.measureLeft}>
                  <Text style={styles.measureDate}>
                    {format(
                      new Date(m.measuredAt || m.createdAt),
                      "MM-dd-yyyy",
                    )}
                  </Text>
                  <View style={styles.measureValues}>
                    {m.weight_lbs ? (
                      <Text style={styles.measureValue}>
                        ⚖️ {m.weight_lbs} lbs {m.weight_oz || 0} oz
                      </Text>
                    ) : null}
                    {m.height_in ? (
                      <Text style={styles.measureValue}>
                        📏 {m.height_in} in
                      </Text>
                    ) : null}
                  </View>
                  {m.notes ? (
                    <Text style={styles.measureNote}>📝 {m.notes}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() =>
                    Alert.alert("Delete", "Remove this measurement?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          await deleteMeasurement(m.id);
                          await loadData();
                        },
                      },
                    ])
                  }
                >
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── MILESTONES TAB ── */}
      {activeTab === "milestones" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.milestonesHeader}>
            {milestones.length} of {MILESTONES.length} milestones reached 🌟
          </Text>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(milestones.length / MILESTONES.length) * 100}%` },
              ]}
            />
          </View>
          {MILESTONES.map((ms) => {
            const achieved = isMilestoneAchieved(ms.key);
            const achievedData = milestones.find((m) => m.key === ms.key);
            return (
              <TouchableOpacity
                key={ms.key}
                onPress={() => handleToggleMilestone(ms.key)}
                activeOpacity={0.8}
                style={[
                  styles.milestoneCard,
                  achieved && styles.milestoneCardDone,
                ]}
              >
                <View
                  style={[
                    styles.milestoneBadge,
                    achieved && styles.milestoneBadgeDone,
                  ]}
                >
                  <Text style={styles.milestoneEmoji}>{ms.emoji}</Text>
                </View>
                <View style={styles.milestoneInfo}>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      achieved && styles.milestoneLabelDone,
                    ]}
                  >
                    {ms.label}
                  </Text>
                  <Text style={styles.milestoneAge}>{ms.age}</Text>
                  {achieved && achievedData?.achievedAt ? (
                    <Text style={styles.milestoneDate}>
                      ✅{" "}
                      {format(
                        new Date(achievedData.achievedAt),
                        "MM-dd-yyyy",
                      )}
                    </Text>
                  ) : null}
                </View>
                <View
                  style={[
                    styles.milestoneCheck,
                    achieved && styles.milestoneCheckDone,
                  ]}
                >
                  <Text style={styles.milestoneCheckText}>
                    {achieved ? "✓" : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── ADD PHOTO MODAL ── */}
      <Modal visible={photoModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>📸 Add Photo</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {newPhotoUri ? (
                  <Image source={{ uri: newPhotoUri }} style={styles.previewImg} />
                ) : (
                  <View style={styles.photoPickerRow}>
                    <TouchableOpacity
                      style={styles.photoPickerBtn}
                      onPress={pickImage}
                    >
                      <Text style={styles.photoPickerEmoji}>🖼️</Text>
                      <Text style={styles.photoPickerLabel}>Gallery</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoPickerBtn}
                      onPress={takePhoto}
                    >
                      <Text style={styles.photoPickerEmoji}>📷</Text>
                      <Text style={styles.photoPickerLabel}>Camera</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {newPhotoUri && (
                  <TouchableOpacity
                    onPress={() => setNewPhotoUri(null)}
                    style={styles.changePhotoBtn}
                  >
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.fieldLabel}>Date (MM-DD-YYYY)</Text>
                <TextInput
                  style={styles.input}
                  value={newPhotoDate}
                  onChangeText={setNewPhotoDate}
                  placeholder="06-15-2024"
                  placeholderTextColor={C.textLight}
                />

                <Text style={styles.fieldLabel}>Caption (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newCaption}
                  onChangeText={setNewCaption}
                  placeholder="e.g. First time at the park!"
                  placeholderTextColor={C.textLight}
                />

                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => {
                      setPhotoModalVisible(false);
                      setNewPhotoUri(null);
                    }}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSave]}
                    onPress={handleSavePhoto}
                  >
                    <Text style={styles.modalBtnSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ADD MEASUREMENT MODAL ── */}
      <Modal visible={measureModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>📏 Log Measurement</Text>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <Text style={styles.fieldLabel}>Date (MM-DD-YYYY)</Text>
                <TextInput
                  style={styles.input}
                  value={newMeasureDate}
                  onChangeText={setNewMeasureDate}
                  placeholder="06-15-2024"
                  placeholderTextColor={C.textLight}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Weight (lbs)</Text>
                    <TextInput
                      style={styles.input}
                      value={newWeight}
                      onChangeText={setNewWeight}
                      placeholder="e.g. 14"
                      keyboardType="decimal-pad"
                      placeholderTextColor={C.textLight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Ounces (oz)</Text>
                    <TextInput
                      style={styles.input}
                      value={newWeightOz || ''}
                      onChangeText={setNewWeightOz}
                      placeholder="e.g. 5"
                      keyboardType="decimal-pad"
                      placeholderTextColor={C.textLight}
                    />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Height (inches)</Text>
                <TextInput
                  style={styles.input}
                  value={newHeight}
                  onChangeText={setNewHeight}
                  placeholder="e.g. 24"
                  keyboardType="decimal-pad"
                  placeholderTextColor={C.textLight}
                />

                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={newMeasureNote}
                  onChangeText={setNewMeasureNote}
                  placeholder="e.g. Doctor's visit"
                  placeholderTextColor={C.textLight}
                />

                <View style={styles.modalBtns}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setMeasureModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnSave]}
                    onPress={handleSaveMeasurement}
                  >
                    <Text style={styles.modalBtnSaveText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── VIEW PHOTO MODAL ── */}
      <Modal visible={viewPhotoVisible} animationType="fade" transparent>
        <View style={styles.photoViewOverlay}>
          <TouchableOpacity
            style={styles.photoViewClose}
            onPress={() => setViewPhotoVisible(false)}
          >
            <Text style={styles.photoViewCloseText}>✕</Text>
          </TouchableOpacity>
          {selectedPhoto && (
            <>
              <Image
                source={{ uri: selectedPhoto.uri }}
                style={[
                  styles.photoViewImg,
                  { width: photoViewSize, height: photoViewSize },
                ]}
                resizeMode="contain"
              />
              {selectedPhoto.caption ? (
                <Text style={styles.photoViewCaption}>
                  {selectedPhoto.caption}
                </Text>
              ) : null}
              <Text style={styles.photoViewDate}>
                {format(
                  new Date(selectedPhoto.takenAt || selectedPhoto.createdAt),
                  "MM-dd-yyyy",
                )}
              </Text>
              <TouchableOpacity
                style={styles.photoViewDelete}
                onPress={() => handleDeletePhoto(selectedPhoto.id)}
              >
                <Text style={styles.photoViewDeleteText}>🗑️ Delete Photo</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

// ─── Simple Line Chart Component ─────────────────────────────────────────────
const SimpleLineChart = ({ data, color, containerWidth }) => {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const chartH = 100;
  // Card has 16px padding each side; fall back to the screen-based guess
  // until onLayout reports the card's actual measured width.
  const chartW = clamp((containerWidth || SCREEN_WIDTH) - 32, 120, 640);
  const stepX = chartW / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * stepX,
    y: chartH - ((d.value - min) / range) * chartH,
    ...d,
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <View style={{ height: chartH + 40, marginTop: 8 }}>
      <View style={{ height: chartH, position: "relative" }}>
        {points.map((p, i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: p.x - 4,
              top: p.y - 4,
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: color,
              borderWidth: 2,
              borderColor: "#fff",
            }}
          />
        ))}
        {points.slice(1).map((p, i) => {
          const prev = points[i];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                left: prev.x,
                top: prev.y,
                width: length,
                height: 2,
                backgroundColor: color + "88",
                transformOrigin: "0 0",
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
          );
        })}
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        {points.map((p, i) => (
          <Text
            key={i}
            style={{ fontSize: 10, color: "#B8A0C0", textAlign: "center" }}
          >
            {p.label}
          </Text>
        ))}
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  tabBar: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 2.5, borderBottomColor: C.primaryDark },
  tabText: { fontSize: 12, fontWeight: "600", color: C.textLight },
  tabTextActive: { color: C.primaryDark },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100, width: '100%', maxWidth: 700, alignSelf: 'center' },

  addPhotoBtn: {
    backgroundColor: C.primaryDark,
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: C.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addPhotoBtnText: { color: C.white, fontWeight: "700", fontSize: 16 },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: C.text },
  emptySub: {
    fontSize: 14,
    color: C.textSec,
    textAlign: "center",
    marginTop: 6,
  },

  monthGroup: { marginBottom: 20 },
  monthLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  monthLine: { flex: 1, height: 1, backgroundColor: C.border },
  monthLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primaryDark,
    paddingHorizontal: 10,
  },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoThumb: {
    width: clamp((SCREEN_WIDTH - 56) / 3, 90, 160),
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: C.surfaceAlt,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoImg: { width: "100%", aspectRatio: 1 },
  photoCaption: {
    fontSize: 10,
    color: C.textSec,
    padding: 4,
    textAlign: "center",
  },

  latestCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  latestTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.text,
    marginBottom: 12,
  },
  latestRow: { flexDirection: "row", gap: 12 },
  latestStat: { flex: 1, borderRadius: 12, padding: 12, alignItems: "center" },
  latestEmoji: { fontSize: 24, marginBottom: 4 },
  latestValue: { fontSize: 22, fontWeight: "800" },
  latestLabel: { fontSize: 12, color: C.textSec, marginTop: 2 },

  chartCard: {
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  chartTitle: { fontSize: 15, fontWeight: "700", color: C.text },

  measureCard: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: C.purple,
  },
  measureLeft: { flex: 1 },
  measureDate: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    marginBottom: 4,
  },
  measureValues: { flexDirection: "row", gap: 12 },
  measureValue: { fontSize: 14, color: C.textSec, fontWeight: "600" },
  measureNote: { fontSize: 12, color: C.textLight, marginTop: 4 },
  deleteBtn: { fontSize: 14, color: C.error, fontWeight: "700", padding: 4 },

  milestonesHeader: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    marginBottom: 10,
    textAlign: "center",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: C.border,
    borderRadius: 999,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: C.green,
    borderRadius: 999,
  },

  milestoneCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
    gap: 12,
  },
  milestoneCardDone: {
    backgroundColor: C.greenLight,
    borderWidth: 1.5,
    borderColor: C.green + "55",
  },
  milestoneBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneBadgeDone: { backgroundColor: C.green + "22" },
  milestoneEmoji: { fontSize: 26 },
  milestoneInfo: { flex: 1 },
  milestoneLabel: { fontSize: 15, fontWeight: "700", color: C.text },
  milestoneLabelDone: { color: C.green },
  milestoneAge: { fontSize: 12, color: C.textSec, marginTop: 2 },
  milestoneDate: {
    fontSize: 11,
    color: C.green,
    marginTop: 3,
    fontWeight: "600",
  },
  milestoneCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  milestoneCheckDone: { backgroundColor: C.green, borderColor: C.green },
  milestoneCheckText: { color: C.white, fontWeight: "800", fontSize: 14 },

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
    marginBottom: 6,
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
  photoPickerRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    justifyContent: "center",
  },
  photoPickerBtn: {
    flex: 1,
    backgroundColor: C.surfaceAlt,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
  },
  photoPickerEmoji: { fontSize: 32, marginBottom: 6 },
  photoPickerLabel: { fontSize: 14, fontWeight: "700", color: C.textSec },
  previewImg: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
  },
  changePhotoBtn: { alignItems: "center", marginBottom: 14 },
  changePhotoText: { color: C.primaryDark, fontWeight: "600", fontSize: 14 },
  modalBtns: { flexDirection: "row", gap: 12, marginTop: 4 },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  modalBtnCancel: { backgroundColor: C.surfaceAlt },
  modalBtnCancelText: { color: C.textSec, fontWeight: "700" },
  modalBtnSave: { backgroundColor: C.primaryDark },
  modalBtnSaveText: { color: C.white, fontWeight: "700" },

  photoViewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  photoViewClose: { position: "absolute", top: 50, right: 20, padding: 10 },
  photoViewCloseText: { color: C.white, fontSize: 22, fontWeight: "700" },
  photoViewImg: {
    borderRadius: 16,
  },
  photoViewCaption: {
    color: C.white,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  photoViewDate: { color: C.textLight, fontSize: 13, marginTop: 6 },
  photoViewDelete: { marginTop: 24, padding: 12 },
  photoViewDeleteText: { color: C.error, fontSize: 15, fontWeight: "700" },
});

export default GrowthScreen;

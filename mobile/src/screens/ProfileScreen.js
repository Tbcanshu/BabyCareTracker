import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { getBabyProfile, saveBabyProfile, getCurrentUser } from '../storage';
import { Button, Input } from '../components/UI';
import { authApi, clearAuthToken } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { formatDateFull } from '../utils/helpers';

const KG_TO_LB = 2.20462;

const ProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [photoUri, setPhotoUri] = useState(null);
  const [saved, setSaved] = useState(false);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const authContext = React.useContext(AuthContext);

  const loadProfile = async () => {
    const profile = await getBabyProfile();
    if (profile) {
      setName(profile.name || '');
      setDob(profile.dob || '');
      setGender(profile.gender || '');
      setWeight(profile.weight || '');
      setWeightUnit(profile.weightUnit || 'kg');
      setPhotoUri(profile.photoUri || null);
    }

    const user = await getCurrentUser();
    setParentName(user?.name || '');
    setParentEmail(user?.email || '');
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please allow access to your photo library to add a baby photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const profile = { name, dob, gender, weight, weightUnit, photoUri };
    const ok = await saveBabyProfile(profile);
    if (ok) {
      setSaved(true);
      if (authContext?.updateGender) {
        authContext.updateGender(gender);
      }
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed' || !selectedDate) return;
    setDob(format(selectedDate, 'yyyy-MM-dd'));
  };

  const handleToggleWeightUnit = (unit) => {
    if (unit === weightUnit) return;
    const num = parseFloat(weight);
    if (!isNaN(num)) {
      const converted = unit === 'lb' ? num * KG_TO_LB : num / KG_TO_LB;
      setWeight(converted.toFixed(2));
    }
    setWeightUnit(unit);
  };

  const ageDisplay = () => {
    if (!dob) return null;
    const parts = dob.split('-');
    if (parts.length !== 3) return null;
    const birth = new Date(dob);
    if (isNaN(birth)) return null;
    const now = new Date();
    const diffMs = now - birth;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 30) return `${diffDays} days old`;
    const months = Math.floor(diffDays / 30);
    if (months < 24) return `${months} months old`;
    return `${Math.floor(months / 12)} years old`;
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 80}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar / Photo */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrapper} activeOpacity={0.85}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarPhoto} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>
                  {gender === 'Girl' ? '👧' : gender === 'Boy' ? '👦' : '👶'}
                </Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          {name ? <Text style={styles.avatarName}>{name}</Text> : null}
          {ageDisplay() ? (
            <Text style={styles.avatarAge}>{ageDisplay()}</Text>
          ) : null}
          <Text style={styles.tapHint}>Tap to change photo</Text>
        </View>

        {/* Parent */}
        {parentName ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Parent</Text>
            <Text style={styles.parentName}>{parentName}</Text>
            {parentEmail ? (
              <Text style={styles.parentEmail}>{parentEmail}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Profile Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Baby Profile</Text>
          <Input
            label="Baby's Name"
            labelStyle={styles.inputLabel}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Aria"
          />
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Text style={dob ? styles.dateText : styles.datePlaceholder}>
                {dob ? formatDateFull(dob) : 'MM-DD-YYYY'}
              </Text>
              <Text style={styles.dateIcon}>📅</Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <View>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={styles.datePickerDoneBtn}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
              <DateTimePicker
                value={dob ? new Date(dob) : new Date()}
                mode="date"
                display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Birth Weight</Text>
            <View style={styles.weightRow}>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="e.g. 3.2"
                placeholderTextColor={COLORS.textLight}
                keyboardType="decimal-pad"
                style={styles.weightInput}
              />
              <View style={styles.unitToggle}>
                {['kg', 'lb'].map((u) => (
                  <TouchableOpacity
                    key={u}
                    onPress={() => handleToggleWeightUnit(u)}
                    style={[
                      styles.unitChip,
                      weightUnit === u && styles.unitChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.unitText,
                        weightUnit === u && styles.unitTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {['Boy', 'Girl', 'Other'].map((g) => (
              <View
                key={g}
                style={[
                  styles.genderChip,
                  gender === g && styles.genderChipActive,
                ]}
              >
                <Text
                  onPress={() => setGender(g)}
                  style={[
                    styles.genderText,
                    gender === g && styles.genderTextActive,
                  ]}
                >
                  {g === 'Boy' ? '👦 ' : g === 'Girl' ? '👧 ' : '🧒 '}
                  {g}
                </Text>
              </View>
            ))}
          </View>

          <Button
            title={saved ? '✅ Profile Saved!' : 'Save Profile'}
            onPress={handleSave}
            style={{ marginTop: SPACING.md, alignSelf: 'center', paddingHorizontal: 32 }}
          />
        </View>

        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <Button
            title="Logout"
            onPress={async () => {
              try {
                await authApi.logout();
              } catch(e) {}
              await clearAuthToken();
              if (authContext) authContext.logout();
            }}
            style={{ marginTop: SPACING.sm, alignSelf: 'center', paddingHorizontal: 32 }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, width: '100%', maxWidth: 700, alignSelf: 'center' },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg, paddingTop: SPACING.sm },
  avatarWrapper: {
    position: 'relative',
    marginBottom: SPACING.sm,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  avatarPhoto: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  avatarEmoji: { fontSize: 52 },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  cameraIcon: { fontSize: 14 },
  avatarName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  avatarAge: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tapHint: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginTop: 4,
  },
  card: {
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  parentName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  parentEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '500',
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  inputWrapper: {
    marginBottom: SPACING.md,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
  },
  datePlaceholder: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
  dateIcon: {
    fontSize: 16,
  },
  datePickerDoneBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  datePickerDoneText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  unitChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  unitChipActive: {
    backgroundColor: COLORS.primaryLight,
  },
  unitText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  unitTextActive: {
    color: COLORS.primaryDark,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  genderChip: {
    flex: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 7,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  genderChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '500',
    color: COLORS.primaryDark,
  },
  genderTextActive: { color: COLORS.primaryDark },
});

export default ProfileScreen;

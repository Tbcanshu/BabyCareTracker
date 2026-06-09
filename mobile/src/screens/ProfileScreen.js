import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { getBabyProfile, saveBabyProfile, clearAllData } from '../storage';
import { Button, Input, Card, Divider } from '../components/UI';
import { authApi, clearAuthToken } from '../utils/api';
import { AuthContext } from '../../AppNavigator';

const ProfileScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [saved, setSaved] = useState(false);
  const authContext = React.useContext(AuthContext);

  const loadProfile = async () => {
    const profile = await getBabyProfile();
    if (profile) {
      setName(profile.name || '');
      setDob(profile.dob || '');
      setGender(profile.gender || '');
      setWeight(profile.weight || '');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const handleSave = async () => {
    const profile = { name, dob, gender, weight };
    const ok = await saveBabyProfile(profile);
    if (ok) {
      setSaved(true);
      if (authContext?.updateGender) {
        authContext.updateGender(gender);
      }
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL entries and the baby profile. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setName('');
            setDob('');
            setGender('');
            setWeight('');
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ]
    );
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>
            {gender === 'Girl' ? '👧' : gender === 'Boy' ? '👦' : '👶'}
          </Text>
        </View>
        {name ? <Text style={styles.avatarName}>{name}</Text> : null}
        {ageDisplay() ? (
          <Text style={styles.avatarAge}>{ageDisplay()}</Text>
        ) : null}
      </View>

      {/* Profile Form */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Baby Profile</Text>
        <Input
          label="Baby's Name"
          value={name}
          onChangeText={setName}
          placeholder="e.g. Aria"
        />
        <Input
          label="Date of Birth (YYYY-MM-DD)"
          value={dob}
          onChangeText={setDob}
          placeholder="e.g. 2024-06-15"
          keyboardType="numbers-and-punctuation"
        />
        <Input
          label="Birth Weight (kg)"
          value={weight}
          onChangeText={setWeight}
          placeholder="e.g. 3.2"
          keyboardType="decimal-pad"
        />

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
          style={{ marginTop: SPACING.md }}
        />
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>About</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App</Text>
          <Text style={styles.infoValue}>Baby Care Tracker</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Storage</Text>
          <Text style={styles.infoValue}>Local (AsyncStorage)</Text>
        </View>
        <Divider />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Data Privacy</Text>
          <Text style={styles.infoValue}>100% on-device 🔒</Text>
        </View>
      </Card>

      {/* Auth Zone */}
      <Card style={styles.card}>
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
          style={{ marginTop: SPACING.sm }}
        />
      </Card>

      {/* Danger Zone */}
      <Card style={[styles.card, styles.dangerCard]}>
        <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
        <Text style={styles.dangerDescription}>
          Permanently delete all entries and profile data. This action cannot be undone.
        </Text>
        <Button
          title="Clear All Data"
          onPress={handleClearData}
          variant="danger"
          style={{ marginTop: SPACING.sm }}
        />
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.lg, paddingTop: SPACING.sm },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
    marginBottom: SPACING.sm,
  },
  avatarEmoji: { fontSize: 48 },
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
  card: { marginBottom: SPACING.md },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  genderRow: { flexDirection: 'row', gap: 8, marginBottom: SPACING.sm },
  genderChip: {
    flex: 1,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
  },
  genderChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  genderText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genderTextActive: { color: COLORS.primaryDark },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  infoValue: { fontSize: FONTS.sizes.sm, fontWeight: '600', color: COLORS.textPrimary },
  dangerCard: {
    borderWidth: 1,
    borderColor: COLORS.error + '44',
    backgroundColor: '#FFF5F5',
  },
  dangerTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.error,
    marginBottom: SPACING.sm,
  },
  dangerDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});

export default ProfileScreen;

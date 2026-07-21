import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TASK_CONFIG } from '../theme';
import { getTodayStats, getBabyProfile, getCurrentUser } from '../storage';
import { formatDuration, formatDateFull } from '../utils/helpers';
import { StatBadge, EmptyState } from '../components/UI';
import EntryCard from '../components/EntryCard';
import TaskButton from '../components/TaskButton';

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [babyName, setBabyName] = useState('Baby');
  const [babyPhoto, setBabyPhoto] = useState(null);
  const [babyGender, setBabyGender] = useState('');
  const [parentName, setParentName] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const profile = await getBabyProfile();
    if (profile?.name) setBabyName(profile.name);
    if (profile?.photoUri) setBabyPhoto(profile.photoUri);
    if (profile?.gender) setBabyGender(profile.gender);

    const user = await getCurrentUser();
    setParentName(user?.name || '');

    const result = await getTodayStats();
    setStats(result.stats);
    setRecentEntries(result.entries.slice(0, 5));
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleTaskPress = (taskKey) => {
    navigation.navigate('AddEntry', { type: taskKey });
  };

  const handleEntryDelete = async () => {
    await loadData();
  };

  const insets = useSafeAreaInsets();
  const todayStr = formatDateFull(new Date().toISOString());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{parentName ? `Hello, ${parentName}` : 'Hello'}</Text>
          <Text style={styles.babyName}>{babyName}'s Day</Text>
          <Text style={styles.date}>{todayStr}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileBtn}
        >
          {babyPhoto ? (
            <Image source={{ uri: babyPhoto }} style={styles.profilePhoto} />
          ) : (
            <Text style={styles.profileEmoji}>
              {babyGender === 'Girl' ? '👧' : babyGender === 'Boy' ? '👦' : '👶'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Assistant Banner */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Chat')}
        style={styles.aiBanner}
        activeOpacity={0.85}
      >
        <View style={styles.aiBannerLeft}>
          <Text style={styles.aiBannerTitle}>Consult AI Baby Nurse 🩺</Text>
          <Text style={styles.aiBannerSubtitle}>Get instant answers about feeding, sleep safety, & care tailored for {babyName}</Text>
        </View>
        <View style={styles.aiBannerIcon}>
          <Text style={styles.aiBannerEmoji}>✨</Text>
        </View>
      </TouchableOpacity>

      {/* Quick Add */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activities</Text>
        <View style={styles.taskGrid}>
          {Object.entries(TASK_CONFIG).map(([key, config]) => (
            <TaskButton
              key={key}
              taskKey={key}
              config={config}
              onPress={handleTaskPress}
            />
          ))}
        </View>
      </View>

      {/* Today's Stats */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today at a Glance</Text>
          <View style={styles.statsRow}>
            <StatBadge
              emoji="🍼"
              image={TASK_CONFIG.milk.image}
              label="Feeds"
              value={stats.milk.count}
              color={COLORS.milkDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'milk' })}
            />
            <StatBadge
              emoji="💧"
              image={TASK_CONFIG.pee.image}
              label="Pees"
              value={stats.pee.count}
              color={COLORS.peeDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'pee' })}
            />
            <StatBadge
              emoji="💩"
              image={TASK_CONFIG.poop.image}
              label="Poops"
              value={stats.poop.count}
              color={COLORS.poopDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'poop' })}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: 8 }]}>
            <StatBadge
              emoji="😢"
              image={TASK_CONFIG.cry.image}
              label="Cry"
              value={stats.cry.totalMin > 0 ? formatDuration(stats.cry.totalMin) : stats.cry.count}
              color={COLORS.cryDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'cry' })}
            />
            <StatBadge
              emoji="😴"
              image={TASK_CONFIG.sleep.image}
              label="Sleep"
              value={stats.sleep.totalMin > 0 ? formatDuration(stats.sleep.totalMin) : stats.sleep.count}
              color={COLORS.sleepDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'sleep' })}
            />
            <StatBadge
              emoji="🛁"
              image={TASK_CONFIG.shower.image}
              label="Baths"
              value={stats.shower.count}
              color={COLORS.showerDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'shower' })}
            />
          </View>
          {stats.milk.totalOz > 0 && (
            <View style={styles.milkTotal}>
              <Text style={styles.milkTotalText}>
                🍼 Total milk today: <Text style={styles.milkTotalValue}>{stats.milk.totalOz.toFixed(1)} oz</Text>
              </Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
    width: '100%',
    maxWidth: 700,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  greeting: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  babyName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: 2,
  },
  profileBtn: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  profilePhoto: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
  },
  profileEmoji: {
    fontSize: 28,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  seeAll: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  milkTotal: {
    backgroundColor: COLORS.milk + '33',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
    alignItems: 'center',
  },
  milkTotalText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  milkTotalValue: {
    fontWeight: '800',
    color: COLORS.milkDark,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  aiBannerLeft: {
    flex: 1,
    paddingRight: SPACING.sm,
  },
  aiBannerTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  aiBannerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    fontWeight: '600',
    lineHeight: 16,
  },
  aiBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  aiBannerEmoji: {
    fontSize: 24,
  },
});

export default HomeScreen;

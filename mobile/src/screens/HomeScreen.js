import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TASK_CONFIG } from '../theme';
import { getTodayStats, getBabyProfile } from '../storage';
import { formatDuration, formatDateFull } from '../utils/helpers';
import { StatBadge, EmptyState } from '../components/UI';
import EntryCard from '../components/EntryCard';
import TaskButton from '../components/TaskButton';

const HomeScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [babyName, setBabyName] = useState('Baby');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const profile = await getBabyProfile();
    if (profile?.name) setBabyName(profile.name);

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

  const todayStr = formatDateFull(new Date().toISOString());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
          <Text style={styles.greeting}>Hello 👋</Text>
          <Text style={styles.babyName}>{babyName}'s Day</Text>
          <Text style={styles.date}>{todayStr}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileBtn}
        >
          <Text style={styles.profileEmoji}>👶</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Add */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
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
              label="Feeds"
              value={stats.milk.count}
              color={COLORS.milkDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'milk' })}
            />
            <StatBadge
              emoji="💧"
              label="Pees"
              value={stats.pee.count}
              color={COLORS.peeDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'pee' })}
            />
            <StatBadge
              emoji="💩"
              label="Poops"
              value={stats.poop.count}
              color={COLORS.poopDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'poop' })}
            />
          </View>
          <View style={[styles.statsRow, { marginTop: 8 }]}>
            <StatBadge
              emoji="😢"
              label="Cry"
              value={stats.cry.totalMin > 0 ? formatDuration(stats.cry.totalMin) : stats.cry.count}
              color={COLORS.cryDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'cry' })}
            />
            <StatBadge
              emoji="😴"
              label="Sleep"
              value={stats.sleep.totalMin > 0 ? formatDuration(stats.sleep.totalMin) : stats.sleep.count}
              color={COLORS.sleepDark}
              onPress={() => navigation.navigate('History', { initialFilter: 'sleep' })}
            />
            <StatBadge
              emoji="🛁"
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
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
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
    ...SHADOWS.sm,
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
});

export default HomeScreen;

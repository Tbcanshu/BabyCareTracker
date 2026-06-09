import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, TASK_CONFIG } from '../theme';
import { getAllEntries } from '../storage';
import { formatDate, groupEntriesByDate } from '../utils/helpers';
import EntryCard from '../components/EntryCard';
import { activitiesApi } from '../utils/api';
import { EmptyState } from '../components/UI';

const FILTERS = [
  { key: 'all', label: 'All', emoji: '📋' },
  { key: 'milk', label: 'Milk', emoji: '🍼' },
  { key: 'pee', label: 'Pee', emoji: '💧' },
  { key: 'poop', label: 'Poop', emoji: '💩' },
  { key: 'cry', label: 'Cry', emoji: '😢' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'shower', label: 'Bath', emoji: '🛁' },
];

const HistoryScreen = ({ navigation, route }) => {
  const { initialFilter } = route.params || {};
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState(initialFilter || 'all');
  const [groupedEntries, setGroupedEntries] = useState({});

  const loadEntries = async () => {
    let allLocal = [];
    try {
      allLocal = await getAllEntries();
    } catch (e) {
      console.log(e);
    }
    
    // Temporarily skip API calls for UI development
    // try {
    //   const apiActivities = await activitiesApi.getActivities(1);
    //   ...
    // } catch(e) {
    //   console.error("Failed to load from API", e);
    // }

    setEntries(allLocal);
  };

  useFocusEffect(
    useCallback(() => {
      loadEntries();
      if (initialFilter) setFilter(initialFilter);
    }, [initialFilter])
  );

  // Re-group when filter changes
  React.useEffect(() => {
    const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter);
    const grouped = groupEntriesByDate(filtered);
    setGroupedEntries(grouped);
  }, [entries, filter]);

  const handleDelete = () => loadEntries();

  const insets = useSafeAreaInsets();
  const dateKeys = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterBar}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[
              styles.filterChip,
              filter === f.key && styles.filterChipActive,
            ]}
          >
            <Text style={styles.filterEmoji}>{f.emoji}</Text>
            <Text
              style={[
                styles.filterLabel,
                filter === f.key && styles.filterLabelActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* List */}
      {dateKeys.length === 0 ? (
        <EmptyState
          emoji="📭"
          title="No entries found"
          subtitle={filter !== 'all' ? 'Try a different filter' : 'Start logging to see history'}
        />
      ) : (
        <FlatList
          data={dateKeys}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: dateKey }) => (
            <View style={styles.dateGroup}>
              <View style={styles.dateLabelRow}>
                <View style={styles.dateLine} />
                <Text style={styles.dateLabel}>
                  {formatDate(dateKey + 'T00:00:00')}
                </Text>
                <View style={styles.dateLine} />
              </View>
              <Text style={styles.dateCount}>
                {groupedEntries[dateKey].length} entr{groupedEntries[dateKey].length === 1 ? 'y' : 'ies'}
              </Text>
              {groupedEntries[dateKey].map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterBar: {
    maxHeight: 60,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  filterEmoji: {
    fontSize: 14,
  },
  filterLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterLabelActive: {
    color: COLORS.primaryDark,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: 100,
  },
  dateGroup: {
    marginBottom: SPACING.md,
  },
  dateLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dateLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  dateCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
    paddingLeft: 4,
  },
});

export default HistoryScreen;

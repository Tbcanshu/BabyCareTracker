import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, TASK_CONFIG } from '../theme';
import { getAllEntries } from '../storage';
import { formatDuration, formatDateShort } from '../utils/helpers';
import { Card, SectionHeader } from '../components/UI';
import { subDays, format, parseISO, startOfDay } from 'date-fns';

const StatsScreen = () => {
  const insets = useSafeAreaInsets();
  const [weeklyData, setWeeklyData] = useState([]);
  const [totals, setTotals] = useState({});

  const loadStats = async () => {
    const entries = await getAllEntries();
    const today = new Date();

    // Build last 7 days
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const key = format(d, 'yyyy-MM-dd');
      const label = formatDateShort(d.toISOString());
      return { key, label, date: d };
    });

    const dayStats = days.map(({ key, label }) => {
      const dayEntries = entries.filter((e) => e.createdAt.startsWith(key));
      return {
        label,
        key,
        milk: dayEntries.filter((e) => e.type === 'milk').length,
        pee: dayEntries.filter((e) => e.type === 'pee').length,
        poop: dayEntries.filter((e) => e.type === 'poop').length,
        cry: dayEntries.filter((e) => e.type === 'cry').reduce((s, e) => s + (Number(e.duration_min) || 0), 0),
        sleep: dayEntries.filter((e) => e.type === 'sleep').reduce((s, e) => s + (Number(e.duration_min) || 0), 0),
        shower: dayEntries.filter((e) => e.type === 'shower').length,
        total: dayEntries.length,
      };
    });

    setWeeklyData(dayStats);

    // Overall totals
    const t = {
      milk: { count: 0, ml: 0 },
      pee: 0,
      poop: 0,
      cry: 0,
      sleep: 0,
      shower: 0,
    };
    entries.forEach((e) => {
      switch (e.type) {
        case 'milk':
          t.milk.count++;
          t.milk.ml += Number(e.amount_ml) || 0;
          break;
        case 'pee': t.pee++; break;
        case 'poop': t.poop++; break;
        case 'cry': t.cry += Number(e.duration_min) || 0; break;
        case 'sleep': t.sleep += Number(e.duration_min) || 0; break;
        case 'shower': t.shower++; break;
      }
    });
    setTotals(t);
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const maxMilk = Math.max(...weeklyData.map((d) => d.milk), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.md, paddingBottom: 100 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Weekly Bar Chart - Milk Feeds */}
      <Card style={styles.chartCard}>
        <SectionHeader title="🍼 Milk Feeds – 7 Days" />
        <View style={styles.barChart}>
          {weeklyData.map((day) => (
            <View key={day.key} style={styles.barCol}>
              <Text style={styles.barValue}>{day.milk > 0 ? day.milk : ''}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${(day.milk / maxMilk) * 100}%`,
                      backgroundColor: COLORS.milkDark,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{day.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Sleep Chart */}
      {weeklyData.length > 0 && (
        <Card style={styles.chartCard}>
          <SectionHeader title="😴 Sleep – 7 Days" />
          <View style={styles.sleepList}>
            {weeklyData.map((day) => {
              const maxSleep = Math.max(...weeklyData.map((d) => d.sleep), 1);
              const pct = (day.sleep / maxSleep) * 100;
              return (
                <View key={day.key} style={styles.sleepRow}>
                  <Text style={styles.sleepDay}>{day.label}</Text>
                  <View style={styles.sleepTrack}>
                    <View
                      style={[
                        styles.sleepBar,
                        { width: `${pct}%`, backgroundColor: COLORS.sleepDark },
                      ]}
                    />
                  </View>
                  <Text style={styles.sleepVal}>
                    {day.sleep > 0 ? formatDuration(day.sleep) : '–'}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* All-Time Totals */}
      <Card style={styles.totalsCard}>
        <SectionHeader title="📊 All-Time Totals" />
        <View style={styles.totalGrid}>
          {[
            { emoji: '🍼', label: 'Milk Feeds', value: totals.milk?.count || 0, sub: totals.milk?.ml > 0 ? `${totals.milk.ml} ml total` : '' },
            { emoji: '💧', label: 'Pee Changes', value: totals.pee || 0, sub: '' },
            { emoji: '💩', label: 'Poop Changes', value: totals.poop || 0, sub: '' },
            { emoji: '😢', label: 'Cry Time', value: totals.cry > 0 ? formatDuration(totals.cry) : '0', sub: '' },
            { emoji: '😴', label: 'Sleep Time', value: totals.sleep > 0 ? formatDuration(totals.sleep) : '0', sub: '' },
            { emoji: '🛁', label: 'Baths', value: totals.shower || 0, sub: '' },
          ].map((item) => (
            <View key={item.label} style={styles.totalItem}>
              <Text style={styles.totalEmoji}>{item.emoji}</Text>
              <Text style={styles.totalValue}>{item.value}</Text>
              <Text style={styles.totalLabel}>{item.label}</Text>
              {item.sub ? <Text style={styles.totalSub}>{item.sub}</Text> : null}
            </View>
          ))}
        </View>
      </Card>

      {/* Weekly activity count */}
      <Card style={styles.activityCard}>
        <SectionHeader title="📅 Daily Activity – 7 Days" />
        {weeklyData.map((day) => (
          <View key={day.key} style={styles.activityRow}>
            <Text style={styles.activityDay}>{day.label}</Text>
            <View style={styles.activityBubbles}>
              {day.milk > 0 && <ActivityBubble emoji="🍼" count={day.milk} color={COLORS.milkDark} />}
              {day.pee > 0 && <ActivityBubble emoji="💧" count={day.pee} color={COLORS.peeDark} />}
              {day.poop > 0 && <ActivityBubble emoji="💩" count={day.poop} color={COLORS.poopDark} />}
              {day.cry > 0 && <ActivityBubble emoji="😢" count={formatDuration(day.cry)} color={COLORS.cryDark} />}
              {day.sleep > 0 && <ActivityBubble emoji="😴" count={formatDuration(day.sleep)} color={COLORS.sleepDark} />}
              {day.shower > 0 && <ActivityBubble emoji="🛁" count={day.shower} color={COLORS.showerDark} />}
              {day.total === 0 && <Text style={styles.noActivity}>No activity</Text>}
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const ActivityBubble = ({ emoji, count, color }) => (
  <View style={[styles.bubble, { borderColor: color + '55', backgroundColor: color + '18' }]}>
    <Text style={styles.bubbleEmoji}>{emoji}</Text>
    <Text style={[styles.bubbleCount, { color }]}>{count}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.md, paddingBottom: SPACING.xxl, width: '100%', maxWidth: 700, alignSelf: 'center' },
  chartCard: { marginBottom: SPACING.md },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: SPACING.md,
  },
  barCol: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.milkDark },
  barTrack: { width: 20, flex: 1, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, fontWeight: '500' },
  sleepList: { gap: 8, marginTop: SPACING.sm },
  sleepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sleepDay: { width: 36, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },
  sleepTrack: { flex: 1, height: 10, backgroundColor: COLORS.border, borderRadius: 5, overflow: 'hidden' },
  sleepBar: { height: '100%', borderRadius: 5, minWidth: 4 },
  sleepVal: { width: 50, fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'right' },
  totalsCard: { marginBottom: SPACING.md },
  totalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: SPACING.sm },
  totalItem: {
    width: '30%',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  totalEmoji: { fontSize: 22, marginBottom: 4 },
  totalValue: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.textPrimary },
  totalLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, textAlign: 'center', marginTop: 2 },
  totalSub: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, textAlign: 'center' },
  activityCard: { marginBottom: SPACING.md },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  activityDay: { width: 40, fontSize: FONTS.sizes.xs, fontWeight: '700', color: COLORS.textSecondary },
  activityBubbles: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  bubble: { flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.full, borderWidth: 1, paddingVertical: 3, paddingHorizontal: 6, gap: 3 },
  bubbleEmoji: { fontSize: 11 },
  bubbleCount: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  noActivity: { fontSize: FONTS.sizes.xs, color: COLORS.textLight, fontStyle: 'italic' },
});

export default StatsScreen;

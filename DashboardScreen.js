import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Switch, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Card, DonutChart, Empty, FadeScreen, T, usePalette } from '../ui';
import {
  catOf, computeTotals, currentMonthKey, expenseByCategory, formatMoney, jalaliLabel, toFaDigits, todayISO,
} from '../utils';

export default function DashboardScreen() {
  const { transactions, isDark, toggleDark } = useStore();
  const p = usePalette();
  const { width } = useWindowDimensions();
  const donutSize = Math.min(180, Math.round(width * 0.4));
  const month = currentMonthKey();

  const totals = useMemo(() => computeTotals(transactions, month), [transactions, month]);
  const breakdown = useMemo(() => expenseByCategory(transactions, month), [transactions, month]);
  const donutData = breakdown.map((b) => ({ ...b, color: catOf(b.key).color }));

  const cards = [
    { label: 'موجودی کل', value: totals.balance, color: p.primary },
    { label: 'درآمد این ماه', value: totals.monthIncome, color: p.income },
    { label: 'هزینه این ماه', value: totals.monthExpense, color: p.expense },
    { label: 'پس‌انداز کل', value: totals.saving, color: p.accent },
  ];

  return (
    <FadeScreen>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
        <View style={styles.header}>
          <View>
            <T font size={24}>سلام!</T>
            <T muted size={13}>{jalaliLabel(todayISO())}</T>
          </View>
          <View style={styles.themeToggle}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={p.muted} />
            <Switch value={isDark} onValueChange={toggleDark} accessibilityLabel="حالت تاریک" />
          </View>
        </View>

        <View style={styles.grid}>
          {cards.map((c) => (
            <Card key={c.label} style={styles.gridItem}>
              <T muted size={13}>{c.label}</T>
              <T font size={18} style={{ color: c.color, marginTop: 6 }}>{formatMoney(c.value)}</T>
            </Card>
          ))}
        </View>

        <Card>
          <T font size={18} style={{ marginBottom: 14 }}>هزینه‌ها به تفکیک دسته</T>
          {donutData.length === 0 ? (
            <Empty text="هنوز هزینه‌ای برای این ماه ثبت نشده است. از تب تراکنش‌ها شروع کنید." />
          ) : (
            <View style={styles.donutRow}>
              <View style={{ width: donutSize, height: donutSize, alignItems: 'center', justifyContent: 'center' }}>
                <DonutChart data={donutData} size={donutSize} stroke={Math.round(donutSize * 0.13)} />
                <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
                  <T font size={13}>{formatMoney(totals.monthExpense)}</T>
                </View>
              </View>
              <View style={{ flex: 1, gap: 10 }}>
                {donutData.map((d) => (
                  <View key={d.key} style={styles.legendRow}>
                    <View style={[styles.dot, { backgroundColor: catOf(d.key).color }]} />
                    <T size={14} style={{ flex: 1 }}>{catOf(d.key).label}</T>
                    <T size={13} muted>{toFaDigits(Math.round((d.value / totals.monthExpense) * 100))}٪</T>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Card>
      </ScrollView>
    </FadeScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: '48%' },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  center: { alignItems: 'center', justifyContent: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useStore } from '../store';
import { BarColumns, Card, Chip, Empty, FadeScreen, T, usePalette } from '../ui';
import {
  JALALI_MONTHS, catOf, computeTotals, currentMonthKey, expenseByCategory, formatMoney,
  toFaDigits, toISO, toJalali,
} from '../utils';

export default function ReportsScreen() {
  const { transactions, isDark } = useStore();
  const p = usePalette();
  const [period, setPeriod] = useState('week');
  const month = currentMonthKey();

  // Weekly and monthly series are built together so switching tabs stays instant.
  const series = useMemo(() => {
    const now = new Date();
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const iso = toISO(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i));
      let income = 0, expense = 0;
      for (const t of transactions) {
        if (t.date !== iso) continue;
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += t.amount;
      }
      week.push({
        label: toFaDigits(toJalali(iso)[2]),
        bars: [{ value: expense, color: '#B91C1C' }, { value: income, color: '#0B6623' }],
      });
    }
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const iso = toISO(d);
      const t = computeTotals(transactions, iso.slice(0, 7));
      months.push({
        label: toFaDigits(toJalali(iso)[1]),
        bars: [{ value: t.monthExpense, color: '#B91C1C' }, { value: t.monthIncome, color: '#0B6623' }],
      });
    }
    return { week, months };
  }, [transactions, isDark]);

  const totals = useMemo(() => computeTotals(transactions, month), [transactions, month]);
  const breakdown = useMemo(() => expenseByCategory(transactions, month), [transactions, month]);
  const net = totals.monthIncome - totals.monthExpense - totals.monthSaving;

  return (
    <FadeScreen>
      <ScrollView contentContainerStyle={styles.content}>
        <T font size={24}>گزارش‌ها</T>
        <View style={styles.chips}>
          <Chip label="هفتگی" active={period === 'week'} onPress={() => setPeriod('week')} />
          <Chip label="ماهانه" active={period === 'month'} onPress={() => setPeriod('month')} />
        </View>

        <Card style={{ gap: 12 }}>
          <View style={styles.row}>
            <Legend color={p.expense} label="هزینه" />
            <Legend color={p.income} label="درآمد" />
          </View>
          <BarColumns data={period === 'week' ? series.week : series.months} />
          <T muted size={12}>
            {period === 'week' ? 'روزهای هفت گذشته به ترتیب تاریخ (شماره‌ی روز شمسی)' : 'شش ماه گذشته (شماره‌ی ماه شمسی)'}
          </T>
        </Card>

        <Card style={{ gap: 10 }}>
          <T font size={18}>خلاصه‌ی این ماه</T>
          <SummaryRow label="درآمد" value={formatMoney(totals.monthIncome)} color={p.income} />
          <SummaryRow label="هزینه" value={formatMoney(totals.monthExpense)} color={p.expense} />
          <SummaryRow label="پس‌انداز" value={formatMoney(totals.monthSaving)} color={p.accent} />
          <SummaryRow label="مانده‌ی ماه" value={formatMoney(Math.abs(net))} color={net >= 0 ? p.income : p.expense} />
        </Card>

        <Card style={{ gap: 12 }}>
          <T font size={18}>هزینه به تفکیک دسته</T>
          {breakdown.length === 0 ? (
            <Empty text="هزینه‌ای برای این ماه ثبت نشده است." />
          ) : (
            breakdown.map((b) => {
              const cat = catOf(b.key);
              const pct = Math.round((b.value / totals.monthExpense) * 100);
              return (
                <View key={b.key} style={{ gap: 6 }}>
                  <View style={styles.row}>
                    <T size={14}>{cat.label}</T>
                    <T size={13} muted>{formatMoney(b.value)} • {toFaDigits(pct)}٪</T>
                  </View>
                  <View style={[styles.track, { backgroundColor: p.border }]}>
                    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: cat.color }} />
                  </View>
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </FadeScreen>
  );
}

function Legend({ color, label }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <T size={12} muted>{label}</T>
    </View>
  );
}

function SummaryRow({ label, value, color }) {
  return (
    <View style={styles.row}>
      <T muted>{label}</T>
      <T font size={15} style={{ color }}>{value}</T>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
});

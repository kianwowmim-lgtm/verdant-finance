import React, { memo, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useStore } from '../store';
import { Button, Card, Empty, Field, FadeScreen, Sheet, T, usePalette } from '../ui';
import {
  MAX_AMOUNT, computeTotals, currentMonthKey, formatMoney, goalSavedMap, parseAmount, toFaDigits,
} from '../utils';

export default function GoalsScreen() {
  const { goals, transactions, deleteGoal } = useStore();
  const [adding, setAdding] = useState(false);
  const [contributing, setContributing] = useState(null);

  const available = useMemo(() => computeTotals(transactions, currentMonthKey()).balance, [transactions]);
  const savedMap = useMemo(() => goalSavedMap(transactions), [transactions]);

  const confirmDelete = (g) =>
    Alert.alert(
      'حذف هدف',
      `«${g.name}» و پس‌اندازهای ثبت‌شده برای آن حذف شوند؟ مبلغ به موجودی برمی‌گردد.`,
      [
        { text: 'انصراف', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteGoal(g.id) },
      ]
    );

  return (
    <FadeScreen>
      <View style={styles.header}>
        <T font size={24}>اهداف پس‌انداز</T>
        <Button title="هدف جدید" icon="add" onPress={() => setAdding(true)} style={styles.smallBtn} />
      </View>

      <FlatList
        data={goals}
        keyExtractor={(g) => g.id}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        ListEmptyComponent={<Empty text="هدفی تعریف نشده. مثلاً «خرید گوشی» یا «مسافرت» را اضافه کنید." />}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            saved={savedMap[item.id] || 0}
            onAdd={() => setContributing(item)}
            onLongPress={() => confirmDelete(item)}
          />
        )}
      />

      <NewGoalSheet visible={adding} onClose={() => setAdding(false)} />
      <Sheet visible={!!contributing} onClose={() => setContributing(null)} title="افزودن پس‌انداز">
        {contributing ? (
          <ContributeForm
            goal={contributing}
            saved={savedMap[contributing.id] || 0}
            available={available}
            onDone={() => setContributing(null)}
          />
        ) : null}
      </Sheet>
    </FadeScreen>
  );
}

const GoalCard = memo(function GoalCard({ goal, saved, onAdd, onLongPress }) {
  const p = usePalette();
  const pct = Math.min(100, Math.round((saved / goal.target) * 100));
  const reached = saved >= goal.target;
  return (
    <TouchableOpacity onLongPress={onLongPress} activeOpacity={0.9} accessibilityHint="برای حذف نگه دارید">
      <Card style={{ gap: 10 }}>
        <View style={styles.goalTop}>
          <T size={17} style={{ flex: 1 }}>{goal.name}</T>
          <T font size={15} style={{ color: reached ? p.income : p.accent }}>{toFaDigits(pct)}٪</T>
        </View>
        <View style={[styles.track, { backgroundColor: p.border }]} accessibilityRole="progressbar">
          <View style={{ width: `${pct}%`, height: '100%', backgroundColor: reached ? p.income : p.primary }} />
        </View>
        <T muted size={13}>{formatMoney(saved)} از {formatMoney(goal.target)}</T>
        {reached ? (
          <T style={{ color: p.income }}>به هدف رسیدید!</T>
        ) : (
          <Button title="افزودن پس‌انداز" variant="outline" icon="wallet-outline" onPress={onAdd} />
        )}
      </Card>
    </TouchableOpacity>
  );
});

function NewGoalSheet({ visible, onClose }) {
  return (
    <Sheet visible={visible} onClose={onClose} title="هدف جدید">
      {visible ? <NewGoalForm onDone={onClose} /> : null}
    </Sheet>
  );
}

function NewGoalForm({ onDone }) {
  const { addGoal } = useStore();
  const p = usePalette();
  const [name, setName] = useState('');
  const [targetText, setTargetText] = useState('');
  const [error, setError] = useState('');
  const target = parseAmount(targetText);

  const submit = () => {
    if (!name.trim()) return setError('نام هدف را وارد کنید.');
    if (!target) return setError('مبلغ هدف باید بیشتر از صفر باشد.');
    if (target > MAX_AMOUNT) return setError('مبلغ بیش از حد بزرگ است.');
    addGoal({ name: name.trim(), target });
    onDone();
  };

  return (
    <>
      <T muted size={13}>نام هدف</T>
      <Field value={name} onChangeText={(v) => { setName(v); setError(''); }} placeholder="مثلاً خرید گوشی" maxLength={40} />
      <T muted size={13}>مبلغ هدف (تومان)</T>
      <Field keyboardType="number-pad" maxLength={16} value={targetText} onChangeText={(v) => { setTargetText(v); setError(''); }} placeholder="مثلاً ۱۵۰۰۰۰۰۰" />
      {target > 0 ? <T muted size={13}>{formatMoney(target)}</T> : null}
      {error ? <T style={{ color: p.expense }}>{error}</T> : null}
      <Button title="ساخت هدف" onPress={submit} />
    </>
  );
}

function ContributeForm({ goal, saved, available, onDone }) {
  const { contribute } = useStore();
  const p = usePalette();
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');
  const amount = parseAmount(amountText);
  const remaining = Math.max(0, goal.target - saved);

  const submit = () => {
    if (!amount) return setError('مبلغ را وارد کنید. مبلغ باید بیشتر از صفر باشد.');
    if (amount > available) {
      return setError(`موجودی کافی نیست. موجودی فعلی: ${formatMoney(Math.max(0, available))}`);
    }
    contribute(goal.id, Math.min(amount, remaining || amount));
    onDone();
  };

  return (
    <>
      <T muted size={14}>هدف: {goal.name}</T>
      <T muted size={13}>مانده تا هدف: {formatMoney(remaining)}</T>
      <T muted size={13}>موجودی قابل استفاده: {formatMoney(Math.max(0, available))}</T>
      <Field
        keyboardType="number-pad"
        maxLength={16}
        value={amountText}
        onChangeText={(v) => { setAmountText(v); setError(''); }}
        placeholder="مبلغ به تومان"
        accessibilityLabel="مبلغ پس‌انداز"
      />
      {amount > 0 ? <T muted size={13}>{formatMoney(amount)}</T> : null}
      {error ? <T style={{ color: p.expense }}>{error}</T> : null}
      <Button title="ثبت پس‌انداز" onPress={submit} />
    </>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  smallBtn: { minHeight: 48, paddingHorizontal: 14 },
  list: { padding: 16, paddingTop: 4, gap: 12, paddingBottom: 32 },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
});

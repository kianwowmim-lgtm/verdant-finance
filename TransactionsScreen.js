import React, { memo, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Button, Card, Chip, Empty, Field, FadeScreen, JalaliDatePicker, MIN_TOUCH, Sheet, T, usePalette } from '../ui';
import {
  CATEGORIES, MAX_AMOUNT, MAX_NOTE, catOf, formatMoney, formatNumber, jalaliLabel,
  parseAmount, todayISO,
} from '../utils';

const TYPES = [
  { key: 'expense', label: 'هزینه' },
  { key: 'income', label: 'درآمد' },
  { key: 'saving', label: 'پس‌انداز' },
];
const TYPE_FILTERS = [{ key: 'all', label: 'همه' }, ...TYPES];
const ALL_CATS = [...CATEGORIES.expense, ...CATEGORIES.income, ...CATEGORIES.saving];

export default function TransactionsScreen() {
  const { transactions, deleteTransaction } = useStore();
  const p = usePalette();
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, 'new' = new, object = edit
  const q = query.trim().toLowerCase();

  const list = useMemo(
    () =>
      transactions.filter(
        (t) =>
          (typeFilter === 'all' || t.type === typeFilter) &&
          (catFilter === 'all' || t.category === catFilter) &&
          (!q ||
            (t.note || '').toLowerCase().includes(q) ||
            catOf(t.category).label.toLowerCase().includes(q))
      ),
    [transactions, typeFilter, catFilter, q]
  );

  const confirmDelete = (t) =>
    Alert.alert('حذف تراکنش', 'این تراکنش برای همیشه حذف شود؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => deleteTransaction(t.id) },
    ]);

  return (
    <FadeScreen>
      <View style={styles.top}>
        <T font size={24}>تراکنش‌ها</T>
        <Field value={query} onChangeText={setQuery} placeholder="جستجو در یادداشت یا دسته" maxLength={40} accessibilityLabel="جستجو" />
        <View style={styles.chips}>
          {TYPE_FILTERS.map((f) => (
            <Chip key={f.key} label={f.label} active={typeFilter === f.key} onPress={() => setTypeFilter(f.key)} />
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ flexDirection: 'row', gap: 8 }}>
          <Chip label="همه دسته‌ها" active={catFilter === 'all'} onPress={() => setCatFilter('all')} />
          {ALL_CATS.map((c) => (
            <Chip key={c.key} label={c.label} icon={c.icon} color={c.color} active={catFilter === c.key} onPress={() => setCatFilter(c.key)} />
          ))}
        </ScrollView>
        <T muted size={12}>برای ویرایش ضربه بزنید و برای حذف نگه دارید.</T>
      </View>

      <FlatList
        data={list}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        initialNumToRender={12}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <Empty text={transactions.length === 0 ? 'اولین تراکنش را با دکمه‌ی + ثبت کنید.' : 'تراکنشی با این فیلتر پیدا نشد.'} />
        }
        renderItem={({ item }) => (
          <TxRow item={item} onPress={() => setEditing(item)} onLongPress={() => confirmDelete(item)} />
        )}
      />

      <TouchableOpacity
        onPress={() => setEditing('new')}
        accessibilityRole="button"
        accessibilityLabel="افزودن تراکنش"
        activeOpacity={0.85}
        style={[styles.fab, { backgroundColor: p.primary }]}
      >
        <Ionicons name="add" size={30} color={p.onPrimary} />
      </TouchableOpacity>

      <Sheet visible={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'تراکنش جدید' : 'ویرایش تراکنش'}>
        {editing !== null ? (
          <TransactionForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Sheet>
    </FadeScreen>
  );
}

const TxRow = memo(function TxRow({ item, onPress, onLongPress }) {
  const p = usePalette();
  const cat = catOf(item.category);
  const color = item.type === 'income' ? p.income : item.type === 'expense' ? p.expense : p.accent;
  const sign = item.type === 'income' ? '+' : '−';
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8} accessibilityRole="button">
      <Card style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: cat.color + '22' }]}>
          <Ionicons name={cat.icon} size={22} color={cat.color} />
        </View>
        <View style={{ flex: 1 }}>
          <T size={16}>{item.note || cat.label}</T>
          <T muted size={12}>{cat.label} • {jalaliLabel(item.date)}</T>
        </View>
        <T font size={16} style={{ color }}>{sign}{formatNumber(item.amount)}</T>
      </Card>
    </TouchableOpacity>
  );
});

function TransactionForm({ initial, onDone }) {
  const { addTransaction, updateTransaction, deleteTransaction } = useStore();
  const p = usePalette();
  const locked = !!(initial && initial.goalId); // savings linked to a goal keep their type

  const [type, setType] = useState(initial ? initial.type : 'expense');
  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : '');
  const [category, setCategory] = useState(initial ? initial.category : CATEGORIES.expense[0].key);
  const [note, setNote] = useState(initial ? initial.note || '' : '');
  const [date, setDate] = useState(initial ? initial.date : todayISO());
  const [showDate, setShowDate] = useState(false);
  const [error, setError] = useState('');

  const amount = parseAmount(amountText);
  const cats = CATEGORIES[type];

  const changeType = (t) => {
    setType(t);
    setCategory(CATEGORIES[t][0].key);
    setError('');
  };

  const submit = () => {
    if (!amount) return setError('مبلغ را وارد کنید. مبلغ باید بیشتر از صفر باشد.');
    if (amount > MAX_AMOUNT) return setError('مبلغ بیش از حد بزرگ است.');
    if (date > todayISO()) return setError('تاریخ آینده مجاز نیست.');
    const patch = { type, amount, category, note: note.trim(), date };
    if (initial) updateTransaction(initial.id, patch);
    else addTransaction(patch);
    onDone();
  };

  const confirmDelete = () =>
    Alert.alert('حذف تراکنش', 'این تراکنش برای همیشه حذف شود؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => { deleteTransaction(initial.id); onDone(); } },
    ]);

  return (
    <>
      <T muted size={13}>نوع تراکنش</T>
      <View style={styles.chips}>
        {TYPES.map((t) => (
          <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => !locked && changeType(t.key)} />
        ))}
      </View>
      {locked ? <T muted size={12}>این پس‌انداز به یک هدف وصل است و نوعش قابل تغییر نیست.</T> : null}

      <T muted size={13}>مبلغ (تومان)</T>
      <Field
        keyboardType="number-pad"
        value={amountText}
        maxLength={16}
        onChangeText={(v) => { setAmountText(v); setError(''); }}
        placeholder="مثلاً ۲۵۰۰۰۰"
        accessibilityLabel="مبلغ"
      />
      {amount > 0 ? <T muted size={13}>{formatMoney(amount)}</T> : null}

      <T muted size={13}>دسته</T>
      <View style={styles.chips}>
        {cats.map((c) => (
          <Chip key={c.key} label={c.label} icon={c.icon} color={c.color} active={category === c.key} onPress={() => setCategory(c.key)} />
        ))}
      </View>

      <T muted size={13}>تاریخ</T>
      <Button
        title={jalaliLabel(date)}
        variant="outline"
        icon="calendar-outline"
        onPress={() => setShowDate((s) => !s)}
      />
      {showDate ? (
        <Card>
          <JalaliDatePicker value={date} onChange={(iso) => { setDate(iso); setShowDate(false); setError(''); }} />
        </Card>
      ) : null}

      <T muted size={13}>یادداشت (اختیاری)</T>
      <Field value={note} onChangeText={setNote} placeholder="مثلاً خرید هفتگی" maxLength={MAX_NOTE} />

      {error ? <T style={{ color: p.expense }}>{error}</T> : null}
      <Button title={initial ? 'ذخیره تغییرات' : 'ثبت تراکنش'} onPress={submit} />
      {initial ? <Button title="حذف تراکنش" variant="danger" icon="trash-outline" onPress={confirmDelete} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  top: { padding: 16, gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  list: { padding: 16, paddingTop: 4, gap: 10, paddingBottom: 110 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    bottom: 16,
    end: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});

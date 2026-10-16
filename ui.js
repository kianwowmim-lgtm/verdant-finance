import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from './store';
import { getPalette, FONT, MIN_TOUCH, RADIUS } from './theme';
import {
  JALALI_MONTHS, daysInJalaliMonth, jalaliToISO, jalaliWeekdayOfFirst,
  jalaliLabel, toFaDigits, toJalali, todayISO,
} from './utils';

export function usePalette() {
  const { isDark } = useStore();
  return useMemo(() => getPalette(isDark), [isDark]);
}

// Fades each screen in when it gets focus. This is the screen transition.
export function FadeScreen({ children, edges = ['top'] }) {
  const p = usePalette();
  const opacity = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }, [opacity])
  );
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: p.bg }}>
      <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>
    </SafeAreaView>
  );
}

export function T({ children, style, font, muted, size = 15, ...rest }) {
  const p = usePalette();
  return (
    <Text
      {...rest}
      style={[
        {
          color: muted ? p.muted : p.text,
          fontSize: size,
          lineHeight: Math.round(size * 1.6),
          textAlign: 'right',
          writingDirection: 'rtl',
          fontFamily: font ? FONT : undefined,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Card({ children, style }) {
  const p = usePalette();
  return (
    <View style={[{ backgroundColor: p.surface, borderRadius: RADIUS, padding: 16, borderWidth: 1, borderColor: p.border }, style]}>
      {children}
    </View>
  );
}

export function Button({ title, onPress, variant = 'primary', style, disabled, icon }) {
  const p = usePalette();
  const primary = variant === 'primary';
  const danger = variant === 'danger';
  const fg = primary ? p.onPrimary : danger ? p.expense : p.text;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      activeOpacity={0.8}
      style={[
        {
          minHeight: MIN_TOUCH,
          borderRadius: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? p.primary : 'transparent',
          borderWidth: primary ? 0 : 1,
          borderColor: danger ? p.expense : p.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: 16, fontWeight: '600' }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Chip({ label, active, onPress, color, icon }) {
  const p = usePalette();
  const tint = color || p.primary;
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      activeOpacity={0.8}
      style={{
        minHeight: MIN_TOUCH,
        paddingHorizontal: 14,
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: active ? tint : p.border,
        backgroundColor: active ? tint + '22' : p.surface,
      }}
    >
      {icon ? <Ionicons name={icon} size={16} color={active ? tint : p.muted} /> : null}
      <T size={14} style={{ color: active ? tint : p.text }}>{label}</T>
    </TouchableOpacity>
  );
}

export function Field({ style, ...props }) {
  const p = usePalette();
  return (
    <TextInput
      placeholderTextColor={p.muted}
      {...props}
      style={[
        {
          minHeight: 52,
          borderRadius: 12,
          paddingHorizontal: 14,
          backgroundColor: p.inputBg,
          color: p.text,
          borderWidth: 1,
          borderColor: p.border,
          textAlign: 'right',
          writingDirection: 'rtl',
          fontSize: 16,
        },
        style,
      ]}
    />
  );
}

export function Empty({ text }) {
  return (
    <View style={{ padding: 24, alignItems: 'center' }}>
      <T muted style={{ textAlign: 'center' }}>{text}</T>
    </View>
  );
}

// Modal sheet. On Android, KeyboardAvoidingView resizes the body so fields stay above the keyboard.
export function Sheet({ visible, onClose, title, children }) {
  const p = usePalette();
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: p.bg }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <T font size={22}>{title}</T>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="بستن"
                style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="close" size={26} color={p.text} />
              </TouchableOpacity>
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// Jalali (Solar Hijri) calendar. Future dates are disabled.
export function JalaliDatePicker({ value, onChange }) {
  const p = usePalette();
  const today = todayISO();
  const [jy, jm] = toJalali(value);
  const [view, setView] = useState({ y: jy, m: jm });

  useEffect(() => {
    const [y, m] = toJalali(value);
    setView({ y, m });
  }, [value]);

  const dim = daysInJalaliMonth(view.y, view.m);
  const offset = jalaliWeekdayOfFirst(view.y, view.m);
  const cells = [...Array(offset).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const shift = (delta) =>
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      if (m < 1) { m = 12; y -= 1; }
      if (m > 12) { m = 1; y += 1; }
      return { y, m };
    });

  const selectedISO = value;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* RTL: the forward (next) arrow sits on the left. */}
        <TouchableOpacity onPress={() => shift(1)} accessibilityLabel="ماه بعد" style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={p.text} />
        </TouchableOpacity>
        <T font size={18}>{`${JALALI_MONTHS[view.m - 1]} ${toFaDigits(view.y)}`}</T>
        <TouchableOpacity onPress={() => shift(-1)} accessibilityLabel="ماه قبل" style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-forward" size={22} color={p.text} />
        </TouchableOpacity>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d) => (
          <T key={d} muted size={12} style={{ flex: 1, textAlign: 'center' }}>{d}</T>
        ))}
      </View>

      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row' }}>
          {row.map((day, c) => {
            if (!day) return <View key={c} style={{ flex: 1, height: MIN_TOUCH }} />;
            const iso = jalaliToISO(view.y, view.m, day);
            const selected = iso === selectedISO;
            const disabled = iso > today;
            return (
              <Pressable
                key={c}
                disabled={disabled}
                onPress={() => onChange(iso)}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                style={{
                  flex: 1,
                  height: MIN_TOUCH,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 12,
                  backgroundColor: selected ? p.primary : 'transparent',
                  opacity: disabled ? 0.35 : 1,
                }}
              >
                <Text style={{ color: selected ? p.onPrimary : p.text, fontSize: 15, fontWeight: selected ? '700' : '400' }}>
                  {toFaDigits(day)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T muted size={13}>انتخاب‌شده: {jalaliLabel(value)}</T>
        <TouchableOpacity onPress={() => onChange(today)} accessibilityRole="button" style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: 8 }}>
          <T style={{ color: p.primary }}>امروز</T>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Donut chart. Each segment is a stroked circle with a dash offset.
export function DonutChart({ data, size = 170, stroke = 22 }) {
  const p = usePalette();
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <Svg width={size} height={size}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={p.border} strokeWidth={stroke} fill="none" />
      {data.map((d) => {
        const len = total ? (d.value / total) * c : 0;
        const el = (
          <Circle
            key={d.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={d.color}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${len} ${c - len}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        );
        offset += len;
        return el;
      })}
    </Svg>
  );
}

// Grouped column chart. data: [{ label, bars: [{ value, color }] }]
export function BarColumns({ data, height = 150 }) {
  const p = usePalette();
  const max = Math.max(1, ...data.flatMap((d) => d.bars.map((b) => b.value)));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', height, gap: 2 }}>
            {d.bars.map((b, j) => (
              <View
                key={j}
                style={{
                  width: 9,
                  height: b.value > 0 ? Math.max(4, (b.value / max) * height) : 2,
                  borderRadius: 4,
                  backgroundColor: b.value > 0 ? b.color : p.border,
                }}
              />
            ))}
          </View>
          <Text style={{ color: p.muted, fontSize: 11, marginTop: 6 }}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

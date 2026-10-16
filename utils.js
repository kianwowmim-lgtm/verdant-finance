const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const DIGIT_SOURCE = '0123456789۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩';
const pad = (n) => String(n).padStart(2, '0');

export const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
export const MAX_AMOUNT = 1e12;
export const MAX_NOTE = 80;

// ---------- digits ----------
export function toFaDigits(input) {
  return String(input).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

export function toEnDigits(input) {
  return String(input).replace(/[۰-۹٠-٩]/g, (d) => String(DIGIT_SOURCE.indexOf(d) % 10));
}

// Keeps digits only, so minus signs, commas, and spaces never produce negative or odd values.
export function parseAmount(text) {
  const digits = toEnDigits(text).replace(/[^0-9]/g, '');
  if (!digits) return 0;
  return Math.min(Number(digits), MAX_AMOUNT + 1);
}

export function formatNumber(n) {
  return toFaDigits(Math.round(n).toLocaleString('en-US'));
}

export function formatMoney(n) {
  return `${formatNumber(n)} تومان`;
}

// ---------- dates ----------
export function toISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISO(new Date());
export const currentMonthKey = () => todayISO().slice(0, 7);

export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm, jd;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy, jm, jd) {
  let gy = jy > 979 ? 1600 : 621;
  const j = jy > 979 ? jy - 979 : jy;
  let days =
    365 * j + Math.floor(j / 33) * 8 + Math.floor(((j % 33) + 3) / 4) +
    78 + jd + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    days--;
    gy += 100 * Math.floor(days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const isLeap = gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0);
  const monthLen = [0, 31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 1;
  while (gm <= 12 && gd > monthLen[gm]) {
    gd -= monthLen[gm];
    gm++;
  }
  return [gy, gm, gd];
}

export function jalaliToISO(jy, jm, jd) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  return `${gy}-${pad(gm)}-${pad(gd)}`;
}

export function toJalali(iso) {
  const [gy, gm, gd] = iso.split('-').map(Number);
  return gregorianToJalali(gy, gm, gd);
}

export function jalaliLabel(iso) {
  const [jy, jm, jd] = toJalali(iso);
  return toFaDigits(`${jy}/${pad(jm)}/${pad(jd)}`);
}

export function daysInJalaliMonth(jy, jm) {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Esfand has 30 days in leap years. Round-trip the 30th to see if it stays in Esfand.
  const [gy, gm, gd] = jalaliToGregorian(jy, 12, 30);
  const back = gregorianToJalali(gy, gm, gd);
  return back[1] === 12 && back[2] === 30 ? 30 : 29;
}

// 0 = Saturday ... 6 = Friday (the Iranian week starts on Saturday).
export function jalaliWeekdayOfFirst(jy, jm) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, 1);
  return (new Date(gy, gm - 1, gd).getDay() + 1) % 7;
}

// ---------- categories ----------
export const CATEGORIES = {
  expense: [
    { key: 'food', label: 'خوراکی', icon: 'fast-food-outline', color: '#F59E0B' },
    { key: 'bills', label: 'قبض', icon: 'receipt-outline', color: '#3B82F6' },
    { key: 'shopping', label: 'خرید', icon: 'bag-handle-outline', color: '#EC4899' },
    { key: 'transport', label: 'حمل‌ونقل', icon: 'bus-outline', color: '#8B5CF6' },
    { key: 'health', label: 'سلامت', icon: 'medkit-outline', color: '#EF4444' },
    { key: 'other', label: 'سایر', icon: 'apps-outline', color: '#64748B' },
  ],
  income: [
    { key: 'salary', label: 'حقوق', icon: 'briefcase-outline', color: '#0B6623' },
    { key: 'extra', label: 'درآمد اضافی', icon: 'cash-outline', color: '#14B8A6' },
  ],
  saving: [{ key: 'saving', label: 'پس‌انداز', icon: 'lock-closed-outline', color: '#D4AF37' }],
};

const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income, ...CATEGORIES.saving];

export function catOf(key) {
  return ALL_CATEGORIES.find((c) => c.key === key) || ALL_CATEGORIES[ALL_CATEGORIES.length - 1];
}

// ---------- calculations ----------
// Available cash = income - expenses - savings. Savings leave the spendable balance.
export function computeTotals(transactions, monthKey) {
  let income = 0, expense = 0, saving = 0;
  let monthIncome = 0, monthExpense = 0, monthSaving = 0;
  for (const t of transactions) {
    const inMonth = t.date.startsWith(monthKey);
    if (t.type === 'income') {
      income += t.amount;
      if (inMonth) monthIncome += t.amount;
    } else if (t.type === 'expense') {
      expense += t.amount;
      if (inMonth) monthExpense += t.amount;
    } else {
      saving += t.amount;
      if (inMonth) monthSaving += t.amount;
    }
  }
  return { balance: income - expense - saving, saving, monthIncome, monthExpense, monthSaving };
}

export function expenseByCategory(transactions, monthKey) {
  const map = {};
  for (const t of transactions) {
    if (t.type === 'expense' && t.date.startsWith(monthKey)) {
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
  }
  return Object.entries(map)
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
}

// Goal progress comes from its linked savings transactions, so editing or deleting one keeps totals correct.
export function goalSavedMap(transactions) {
  const map = {};
  for (const t of transactions) {
    if (t.goalId) map[t.goalId] = (map[t.goalId] || 0) + t.amount;
  }
  return map;
}

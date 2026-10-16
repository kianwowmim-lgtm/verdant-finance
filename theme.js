export const brand = {
  deep: '#004D40',
  emerald: '#005B5C',
  forest: '#0B6623',
  gold: '#D4AF37',
  mint: '#A3E4D7',
  dark: '#0F172A',
  light: '#F8FAFC',
};

export const FONT = 'DigiLalezar';
export const MIN_TOUCH = 48;
export const RADIUS = 16;

export function getPalette(isDark) {
  if (isDark) {
    return {
      bg: brand.dark,
      surface: '#1E293B',
      surfaceAlt: '#273549',
      inputBg: '#0B1220',
      border: '#334155',
      text: '#F1F5F9',
      muted: '#94A3B8',
      primary: brand.mint,
      onPrimary: brand.dark,
      accent: brand.gold,
      income: '#34D399',
      expense: '#F87171',
    };
  }
  return {
    bg: brand.light,
    surface: '#FFFFFF',
    surfaceAlt: '#EEF6F4',
    inputBg: '#F1F5F9',
    border: '#E2E8F0',
    text: brand.dark,
    muted: '#64748B',
    primary: brand.deep,
    onPrimary: '#FFFFFF',
    accent: brand.gold,
    income: brand.forest,
    expense: '#B91C1C',
  };
}

import { createSeedData } from '../data/seedData';
import { FinanceData, ThemeMode } from '../types/finance';

const STORAGE_KEY = 'taichinh360_finance_data_v1';
const THEME_KEY = 'taichinh360_theme_v1';

export function loadFinanceData(): FinanceData {
  if (typeof window === 'undefined') {
    return createSeedData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createSeedData();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(raw) as Partial<FinanceData>;
    if (
      typeof parsed.openingCash !== 'number' ||
      !Array.isArray(parsed.stocks) ||
      !Array.isArray(parsed.gold) ||
      !Array.isArray(parsed.transactions) ||
      !Array.isArray(parsed.debts)
    ) {
      return createSeedData();
    }

    return {
      openingCash: parsed.openingCash,
      stocks: parsed.stocks,
      gold: parsed.gold,
      transactions: parsed.transactions,
      debts: parsed.debts,
      marketLastSync: parsed.marketLastSync ?? new Date().toISOString(),
      marketSource: parsed.marketSource ?? 'simulated',
    };
  } catch {
    return createSeedData();
  }
}

export function saveFinanceData(data: FinanceData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetFinanceData(): FinanceData {
  const seed = createSeedData();
  saveFinanceData(seed);
  return seed;
}

export function loadThemeMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function saveThemeMode(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}

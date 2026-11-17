export type NavTab = 'dashboard' | 'portfolio' | 'transactions' | 'debts';
export type PortfolioSubTab = 'stocks' | 'gold';
export type ThemeMode = 'light' | 'dark';

export interface StockHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  prevClose: number;
  lastUpdated: string;
}

export type GoldUnit = 'chỉ' | 'lượng';

export interface GoldHolding {
  id: string;
  type: string;
  unit: GoldUnit;
  quantity: number;
  buyPrice: number;
  currentMarketPrice: number;
  lastUpdated: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
}

export type DebtDirection = 'i_owe' | 'owed_to_me';
export type DebtStatus = 'unpaid' | 'paid';

export interface DebtItem {
  id: string;
  direction: DebtDirection;
  personName: string;
  amount: number;
  loanDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  note: string;
  status: DebtStatus;
}

export interface FinanceData {
  openingCash: number;
  stocks: StockHolding[];
  gold: GoldHolding[];
  transactions: Transaction[];
  debts: DebtItem[];
  marketLastSync: string;
  marketSource: 'live' | 'simulated';
}

export interface AssetMetrics {
  costBasis: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export interface StockMetrics extends AssetMetrics {
  dayChange: number;
  dayChangePercent: number;
}

export type DeadlineSeverity = 'paid' | 'overdue' | 'upcoming' | 'normal';

export interface DebtDeadlineInfo {
  severity: DeadlineSeverity;
  daysRemaining: number;
  label: string;
}

export interface AllocationSlice {
  key: 'cash' | 'gold' | 'stocks';
  name: string;
  value: number;
  percentage: number;
}

export interface BalanceHistoryPoint {
  monthKey: string;
  label: string;
  cash: number;
  investments: number;
  netWorth: number;
}

export interface FinanceSummary {
  totalCash: number;
  totalStockCost: number;
  totalStockValue: number;
  totalStockPnl: number;
  totalStockPnlPercent: number;
  totalGoldCost: number;
  totalGoldValue: number;
  totalGoldPnl: number;
  totalGoldPnlPercent: number;
  totalInvestments: number;
  totalInvestmentCost: number;
  totalInvestmentPnl: number;
  totalInvestmentPnlPercent: number;
  totalLiabilities: number;
  totalReceivables: number;
  netWorth: number;
  overdueDebtCount: number;
  upcomingDebtCount: number;
  allocation: AllocationSlice[];
}

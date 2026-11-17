import {
  AllocationSlice,
  AssetMetrics,
  BalanceHistoryPoint,
  DebtDeadlineInfo,
  DebtItem,
  FinanceData,
  FinanceSummary,
  GoldHolding,
  StockHolding,
  StockMetrics,
  Transaction,
  TransactionType,
} from '../types/finance';

export function formatVND(amount: number, compact = false): string {
  if (!Number.isFinite(amount)) return '0 ₫';

  if (compact) {
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (abs >= 1_000_000_000) {
      return `${sign}${(abs / 1_000_000_000).toLocaleString('vi-VN', {
        maximumFractionDigits: 2,
      })} Tỷ`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toLocaleString('vi-VN', {
        maximumFractionDigits: 1,
      })} Tr`;
    }
    if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toLocaleString('vi-VN', {
        maximumFractionDigits: 0,
      })} K`;
    }
  }

  return `${Math.round(amount).toLocaleString('vi-VN')} ₫`;
}

export function formatSignedVND(amount: number): string {
  if (!Number.isFinite(amount) || Math.round(amount) === 0) return '0 ₫';
  const prefix = amount > 0 ? '+' : '';
  return `${prefix}${formatVND(amount)}`;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0,00%';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString('vi-VN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatDateVI(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return isoDate;
  const [y, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateStockMetrics(stock: StockHolding): StockMetrics {
  const costBasis = stock.quantity * stock.avgCost;
  const marketValue = stock.quantity * stock.currentPrice;
  const pnl = marketValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  const dayChange = stock.quantity * (stock.currentPrice - stock.prevClose);
  const dayChangePercent =
    stock.prevClose > 0
      ? ((stock.currentPrice - stock.prevClose) / stock.prevClose) * 100
      : 0;

  return {
    costBasis,
    marketValue,
    pnl,
    pnlPercent,
    dayChange,
    dayChangePercent,
  };
}

export function calculateGoldMetrics(gold: GoldHolding): AssetMetrics {
  const costBasis = gold.quantity * gold.buyPrice;
  const marketValue = gold.quantity * gold.currentMarketPrice;
  const pnl = marketValue - costBasis;
  const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

  return {
    costBasis,
    marketValue,
    pnl,
    pnlPercent,
  };
}

export function getDebtDeadlineInfo(
  debt: Pick<DebtItem, 'dueDate' | 'status'>,
  referenceDateISO = getTodayISO()
): DebtDeadlineInfo {
  if (debt.status === 'paid') {
    return {
      severity: 'paid',
      daysRemaining: 0,
      label: 'Đã tất toán',
    };
  }

  const due = parseISODateUTC(debt.dueDate);
  const ref = parseISODateUTC(referenceDateISO);
  if (!due || !ref) {
    return {
      severity: 'normal',
      daysRemaining: 0,
      label: 'Chưa xác định',
    };
  }

  const diffDays = Math.round((due - ref) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      severity: 'overdue',
      daysRemaining: diffDays,
      label: `Quá hạn ${Math.abs(diffDays)} ngày`,
    };
  }

  if (diffDays === 0) {
    return {
      severity: 'upcoming',
      daysRemaining: 0,
      label: 'Đến hạn hôm nay',
    };
  }

  if (diffDays <= 7) {
    return {
      severity: 'upcoming',
      daysRemaining: diffDays,
      label: `Sắp đến hạn (${diffDays} ngày)`,
    };
  }

  return {
    severity: 'normal',
    daysRemaining: diffDays,
    label: `Còn ${diffDays} ngày`,
  };
}

function parseISODateUTC(iso: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  return Date.UTC(year, month, day);
}

export function calculateFinanceSummary(
  data: FinanceData,
  referenceDateISO = getTodayISO()
): FinanceSummary {
  const transactionCashflow = data.transactions.reduce((acc, tx) => {
    return tx.type === 'income' ? acc + tx.amount : acc - tx.amount;
  }, 0);

  const totalCash = data.openingCash + transactionCashflow;

  let totalStockCost = 0;
  let totalStockValue = 0;
  for (const stock of data.stocks) {
    const m = calculateStockMetrics(stock);
    totalStockCost += m.costBasis;
    totalStockValue += m.marketValue;
  }
  const totalStockPnl = totalStockValue - totalStockCost;
  const totalStockPnlPercent =
    totalStockCost > 0 ? (totalStockPnl / totalStockCost) * 100 : 0;

  let totalGoldCost = 0;
  let totalGoldValue = 0;
  for (const item of data.gold) {
    const m = calculateGoldMetrics(item);
    totalGoldCost += m.costBasis;
    totalGoldValue += m.marketValue;
  }
  const totalGoldPnl = totalGoldValue - totalGoldCost;
  const totalGoldPnlPercent =
    totalGoldCost > 0 ? (totalGoldPnl / totalGoldCost) * 100 : 0;

  const totalInvestments = totalStockValue + totalGoldValue;
  const totalInvestmentCost = totalStockCost + totalGoldCost;
  const totalInvestmentPnl = totalInvestments - totalInvestmentCost;
  const totalInvestmentPnlPercent =
    totalInvestmentCost > 0
      ? (totalInvestmentPnl / totalInvestmentCost) * 100
      : 0;

  let totalLiabilities = 0;
  let totalReceivables = 0;
  let overdueDebtCount = 0;
  let upcomingDebtCount = 0;

  for (const debt of data.debts) {
    if (debt.status === 'unpaid') {
      if (debt.direction === 'i_owe') {
        totalLiabilities += debt.amount;
      } else {
        totalReceivables += debt.amount;
      }
      const info = getDebtDeadlineInfo(debt, referenceDateISO);
      if (info.severity === 'overdue') overdueDebtCount += 1;
      if (info.severity === 'upcoming') upcomingDebtCount += 1;
    }
  }

  const netWorth =
    totalCash + totalInvestments + totalReceivables - totalLiabilities;

  const positiveCash = Math.max(0, totalCash);
  const grossAssets = positiveCash + totalGoldValue + totalStockValue;

  const allocation: AllocationSlice[] = [
    {
      key: 'cash',
      name: 'Tiền mặt',
      value: positiveCash,
      percentage: grossAssets > 0 ? (positiveCash / grossAssets) * 100 : 0,
    },
    {
      key: 'gold',
      name: 'Vàng',
      value: totalGoldValue,
      percentage: grossAssets > 0 ? (totalGoldValue / grossAssets) * 100 : 0,
    },
    {
      key: 'stocks',
      name: 'Cổ phiếu',
      value: totalStockValue,
      percentage: grossAssets > 0 ? (totalStockValue / grossAssets) * 100 : 0,
    },
  ];

  return {
    totalCash,
    totalStockCost,
    totalStockValue,
    totalStockPnl,
    totalStockPnlPercent,
    totalGoldCost,
    totalGoldValue,
    totalGoldPnl,
    totalGoldPnlPercent,
    totalInvestments,
    totalInvestmentCost,
    totalInvestmentPnl,
    totalInvestmentPnlPercent,
    totalLiabilities,
    totalReceivables,
    netWorth,
    overdueDebtCount,
    upcomingDebtCount,
    allocation,
  };
}

export interface TransactionFilter {
  month: number | 'all'; // 1-12 or 'all'
  year: number | 'all';
  type: TransactionType | 'all';
  category: string | 'all';
  search: string;
}

export function filterTransactions(
  transactions: Transaction[],
  filter: TransactionFilter
): Transaction[] {
  const q = filter.search.trim().toLowerCase();
  return [...transactions]
    .filter((tx) => {
      const [yStr, mStr] = tx.date.split('-');
      const txYear = Number(yStr);
      const txMonth = Number(mStr);
      if (filter.year !== 'all' && txYear !== filter.year) return false;
      if (filter.month !== 'all' && txMonth !== filter.month) return false;
      if (filter.type !== 'all' && tx.type !== filter.type) return false;
      if (filter.category !== 'all' && tx.category !== filter.category) return false;
      if (q) {
        const hay = `${tx.description} ${tx.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface PeriodStats {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export function summarizeTransactionsByPeriod(
  transactions: Transaction[],
  year: number,
  month?: number
): PeriodStats {
  let income = 0;
  let expense = 0;
  let count = 0;

  for (const tx of transactions) {
    const [yStr, mStr] = tx.date.split('-');
    if (Number(yStr) !== year) continue;
    if (month !== undefined && Number(mStr) !== month) continue;
    count += 1;
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  }

  return {
    income,
    expense,
    net: income - expense,
    count,
  };
}

export function buildBalanceHistory(
  data: FinanceData,
  referenceDateISO = getTodayISO()
): BalanceHistoryPoint[] {
  const summary = calculateFinanceSummary(data, referenceDateISO);
  const [refY, refM] = referenceDateISO.split('-').map(Number);

  // Build 6 monthly checkpoints ending on the reference month
  const months: { year: number; month: number; key: string; label: string }[] = [];
  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(Date.UTC(refY, refM - 1 - offset, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    months.push({
      year: y,
      month: m,
      key: `${y}-${String(m).padStart(2, '0')}`,
      label: `T${m}/${String(y).slice(2)}`,
    });
  }

  // Reconstruct cash retroactively by month from current totalCash
  const monthlyCashflow = new Map<string, number>();
  for (const tx of data.transactions) {
    const key = tx.date.slice(0, 7);
    const delta = tx.type === 'income' ? tx.amount : -tx.amount;
    monthlyCashflow.set(key, (monthlyCashflow.get(key) ?? 0) + delta);
  }

  const points: BalanceHistoryPoint[] = [];
  // Walk backwards from current month's cash
  let runningCash = summary.totalCash;
  const cashByMonth = new Map<string, number>();

  for (let i = months.length - 1; i >= 0; i--) {
    const mk = months[i].key;
    cashByMonth.set(mk, Math.max(0, runningCash));
    runningCash -= monthlyCashflow.get(mk) ?? 0;
  }

  // Investment growth curve anchored to cost basis -> current market value
  const baseInv = summary.totalInvestmentCost || summary.totalInvestments * 0.9;
  const currentInv = summary.totalInvestments;
  const netDebtAdj = summary.totalReceivables - summary.totalLiabilities;

  months.forEach((m, idx) => {
    const progress = idx / (months.length - 1);
    const inv =
      idx === months.length - 1
        ? currentInv
        : Math.round(baseInv + (currentInv - baseInv) * Math.pow(progress, 1.15));
    const cash = cashByMonth.get(m.key) ?? 0;
    const netWorth =
      idx === months.length - 1
        ? summary.netWorth
        : Math.round(cash + inv + netDebtAdj * (0.7 + 0.3 * progress));

    points.push({
      monthKey: m.key,
      label: m.label,
      cash,
      investments: inv,
      netWorth,
    });
  });

  return points;
}

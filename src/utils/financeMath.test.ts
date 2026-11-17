import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBalanceHistory,
  calculateFinanceSummary,
  calculateGoldMetrics,
  calculateStockMetrics,
  filterTransactions,
  formatPercent,
  formatVND,
  getDebtDeadlineInfo,
  summarizeTransactionsByPeriod,
} from './financeMath';
import type { FinanceData } from '../types/finance';

test('calculateStockMetrics computes cost, market value, PnL and day change', () => {
  const metrics = calculateStockMetrics({
    id: 's1',
    symbol: 'VCB',
    name: 'Vietcombank',
    quantity: 100,
    avgCost: 85000,
    currentPrice: 93500,
    prevClose: 92000,
    lastUpdated: '2026-11-16T10:00:00Z',
  });

  assert.equal(metrics.costBasis, 8_500_000);
  assert.equal(metrics.marketValue, 9_350_000);
  assert.equal(metrics.pnl, 850_000);
  assert.equal(metrics.pnlPercent, 10);
  assert.equal(metrics.dayChange, 150_000);
});

test('calculateGoldMetrics handles losses accurately', () => {
  const metrics = calculateGoldMetrics({
    id: 'g1',
    type: 'Vàng miếng SJC',
    unit: 'lượng',
    quantity: 2,
    buyPrice: 85_000_000,
    currentMarketPrice: 83_300_000,
    lastUpdated: '2026-11-16T10:00:00Z',
  });

  assert.equal(metrics.costBasis, 170_000_000);
  assert.equal(metrics.marketValue, 166_600_000);
  assert.equal(metrics.pnl, -3_400_000);
  assert.equal(metrics.pnlPercent, -2);
});

test('getDebtDeadlineInfo distinguishes paid, overdue, upcoming, and normal', () => {
  assert.equal(
    getDebtDeadlineInfo({ dueDate: '2026-11-01', status: 'paid' }, '2026-11-16').severity,
    'paid'
  );
  const overdue = getDebtDeadlineInfo(
    { dueDate: '2026-11-10', status: 'unpaid' },
    '2026-11-16'
  );
  assert.equal(overdue.severity, 'overdue');
  assert.equal(overdue.daysRemaining, -6);

  const upcoming = getDebtDeadlineInfo(
    { dueDate: '2026-11-20', status: 'unpaid' },
    '2026-11-16'
  );
  assert.equal(upcoming.severity, 'upcoming');
  assert.equal(upcoming.daysRemaining, 4);

  const normal = getDebtDeadlineInfo(
    { dueDate: '2026-12-15', status: 'unpaid' },
    '2026-11-16'
  );
  assert.equal(normal.severity, 'normal');
});

test('calculateFinanceSummary computes Net Worth, Cash, Investments, Debts, and Allocation', () => {
  const sample: FinanceData = {
    openingCash: 100_000_000,
    stocks: [
      {
        id: 's1',
        symbol: 'MBB',
        name: 'MB Bank',
        quantity: 1000,
        avgCost: 22000,
        currentPrice: 25000,
        prevClose: 24500,
        lastUpdated: '2026-11-16',
      },
    ],
    gold: [
      {
        id: 'g1',
        type: 'Vàng nhẫn 9999',
        unit: 'chỉ',
        quantity: 5,
        buyPrice: 8_000_000,
        currentMarketPrice: 8_500_000,
        lastUpdated: '2026-11-16',
      },
    ],
    transactions: [
      {
        id: 't1',
        date: '2026-11-05',
        type: 'income',
        category: 'Lương',
        description: 'Lương tháng 11',
        amount: 30_000_000,
      },
      {
        id: 't2',
        date: '2026-11-10',
        type: 'expense',
        category: 'Ăn uống',
        description: 'Siêu thị',
        amount: 5_000_000,
      },
    ],
    debts: [
      {
        id: 'd1',
        direction: 'i_owe',
        personName: 'Minh',
        amount: 10_000_000,
        loanDate: '2026-10-01',
        dueDate: '2026-11-12',
        note: 'Vay nóng',
        status: 'unpaid',
      },
      {
        id: 'd2',
        direction: 'owed_to_me',
        personName: 'Lan',
        amount: 15_000_000,
        loanDate: '2026-10-15',
        dueDate: '2026-11-20',
        note: 'Tạm ứng',
        status: 'unpaid',
      },
      {
        id: 'd3',
        direction: 'i_owe',
        personName: 'Hùng',
        amount: 50_000_000,
        loanDate: '2026-08-01',
        dueDate: '2026-09-01',
        note: 'Đã trả xong',
        status: 'paid',
      },
    ],
    marketLastSync: '2026-11-16',
    marketSource: 'simulated',
  };

  const summary = calculateFinanceSummary(sample, '2026-11-16');

  // Cash = 100M + 30M - 5M = 125M
  assert.equal(summary.totalCash, 125_000_000);
  // Stocks = 25M, Gold = 42.5M -> Investments = 67.5M
  assert.equal(summary.totalStockValue, 25_000_000);
  assert.equal(summary.totalGoldValue, 42_500_000);
  assert.equal(summary.totalInvestments, 67_500_000);
  // Unpaid liabilities = 10M, Unpaid receivables = 15M (paid 50M ignored)
  assert.equal(summary.totalLiabilities, 10_000_000);
  assert.equal(summary.totalReceivables, 15_000_000);
  // Net worth = 125 + 67.5 + 15 - 10 = 197.5M
  assert.equal(summary.netWorth, 197_500_000);
  assert.equal(summary.overdueDebtCount, 1);
  assert.equal(summary.upcomingDebtCount, 1);

  const history = buildBalanceHistory(sample, '2026-11-16');
  assert.equal(history.length, 6);
  assert.equal(history[5].netWorth, summary.netWorth);
  assert.equal(history[5].cash, summary.totalCash);
});

test('filterTransactions and summarizeTransactionsByPeriod filter by month, year, category, and search', () => {
  const txs = [
    {
      id: '1',
      date: '2026-11-12',
      type: 'expense' as const,
      category: 'Ăn uống',
      description: 'Cơm trưa văn phòng',
      amount: 65000,
    },
    {
      id: '2',
      date: '2026-11-01',
      type: 'income' as const,
      category: 'Lương',
      description: 'Lương chính',
      amount: 28000000,
    },
    {
      id: '3',
      date: '2026-10-20',
      type: 'expense' as const,
      category: 'Giải trí',
      description: 'Vé xem phim',
      amount: 240000,
    },
  ];

  const novStats = summarizeTransactionsByPeriod(txs, 2026, 11);
  assert.equal(novStats.income, 28_000_000);
  assert.equal(novStats.expense, 65_000);
  assert.equal(novStats.net, 27_935_000);

  const yearStats = summarizeTransactionsByPeriod(txs, 2026);
  assert.equal(yearStats.expense, 305_000);

  const filtered = filterTransactions(txs, {
    month: 11,
    year: 2026,
    type: 'all',
    category: 'all',
    search: 'cơm',
  });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '1');
});

test('formatters return expected Vietnamese formats', () => {
  assert.ok(formatVND(1500000).includes('1.500.000'));
  assert.equal(formatPercent(12.5), '+12,50%');
});

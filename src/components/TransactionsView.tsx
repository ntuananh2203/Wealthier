import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seedData';
import { Transaction, TransactionType } from '../types/finance';
import {
  filterTransactions,
  formatDateVI,
  formatSignedVND,
  formatVND,
  getTodayISO,
  summarizeTransactionsByPeriod,
} from '../utils/financeMath';

interface TransactionsViewProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsView({
  transactions,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const today = getTodayISO();
  const [defaultYear, defaultMonth] = today.split('-').map(Number);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>(defaultMonth);
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const availableYears = useMemo(() => {
    const set = new Set<number>([defaultYear, defaultYear - 1]);
    for (const tx of transactions) {
      const y = Number(tx.date.slice(0, 4));
      if (Number.isFinite(y)) set.add(y);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [transactions, defaultYear]);

  const allCategories = useMemo(() => {
    const set = new Set<string>([
      ...INCOME_CATEGORIES,
      ...EXPENSE_CATEGORIES,
      ...transactions.map((t) => t.category),
    ]);
    return Array.from(set);
  }, [transactions]);

  const monthStats = useMemo(() => {
    const m = selectedMonth === 'all' ? defaultMonth : selectedMonth;
    return summarizeTransactionsByPeriod(transactions, selectedYear, m);
  }, [transactions, selectedYear, selectedMonth, defaultMonth]);

  const yearStats = useMemo(() => {
    return summarizeTransactionsByPeriod(transactions, selectedYear);
  }, [transactions, selectedYear]);

  const filtered = useMemo(() => {
    return filterTransactions(transactions, {
      year: selectedYear,
      month: selectedMonth,
      type: selectedType,
      category: selectedCategory,
      search: searchQuery,
    });
  }, [
    transactions,
    selectedYear,
    selectedMonth,
    selectedType,
    selectedCategory,
    searchQuery,
  ]);

  const resetFilters = () => {
    setSelectedMonth('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Monthly & Yearly Summary Cards */}
      <section
        aria-label="Thống kê thu chi theo tháng và năm"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800"
      >
        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Thống kê Tháng{' '}
              {selectedMonth === 'all' ? defaultMonth : selectedMonth}/{selectedYear}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {monthStats.count} giao dịch
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng thu</p>
              <p className="mt-1 font-mono text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatVND(monthStats.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng chi</p>
              <p className="mt-1 font-mono text-base sm:text-lg font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatVND(monthStats.expense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chênh lệch
              </p>
              <p
                className={`mt-1 font-mono text-base sm:text-lg font-semibold tabular-nums ${
                  monthStats.net >= 0
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedVND(monthStats.net)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Lũy kế Năm {selectedYear}
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {yearStats.count} giao dịch
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng thu</p>
              <p className="mt-1 font-mono text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatVND(yearStats.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Tổng chi</p>
              <p className="mt-1 font-mono text-base sm:text-lg font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                {formatVND(yearStats.expense)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tích lũy ròng
              </p>
              <p
                className={`mt-1 font-mono text-base sm:text-lg font-semibold tabular-nums ${
                  yearStats.net >= 0
                    ? 'text-slate-900 dark:text-slate-100'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedVND(yearStats.net)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              aria-label="Tìm kiếm giao dịch"
              placeholder="Tìm mô tả hoặc danh mục..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 w-56 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            aria-label="Lọc theo tháng"
            value={selectedMonth}
            onChange={(e) =>
              setSelectedMonth(
                e.target.value === 'all' ? 'all' : Number(e.target.value)
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, idx) => idx + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo năm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo loại thu chi"
            value={selectedType}
            onChange={(e) =>
              setSelectedType(e.target.value as TransactionType | 'all')
            }
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Thu & Chi</option>
            <option value="income">Chỉ Thu nhập</option>
            <option value="expense">Chỉ Chi tiêu</option>
          </select>

          <select
            aria-label="Lọc theo danh mục"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Tất cả danh mục</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onAddTransaction}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ghi giao dịch mới</span>
        </button>
      </div>

      {/* Ledger Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Nhật ký giao dịch
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {filtered.length} kết quả
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Không tìm thấy giao dịch nào phù hợp với bộ lọc hiện tại.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Xóa bộ lọc
              </button>
              <button
                type="button"
                onClick={onAddTransaction}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                Thêm giao dịch
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-6">Ngày</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4">Mô tả</th>
                  <th className="py-3 px-4">Loại</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDateVI(tx.date)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap">
                      {tx.category}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 max-w-[320px] truncate">
                      {tx.description}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          tx.type === 'income'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>Thu nhập</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>Chi tiêu</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                        tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {formatVND(tx.amount)}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEditTransaction(tx)}
                          aria-label={`Chỉnh sửa giao dịch ${tx.description}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(tx.id)}
                          aria-label={`Xóa giao dịch ${tx.description}`}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { syncPullFromCloud } from '../services/cloudSync'; // <-- THÊM DÒNG NÀY
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BalanceHistoryPoint,
  DebtItem,
  FinanceData,
  FinanceSummary,
  NavTab,
  ThemeMode,
} from '../types/finance';
import {
  formatDateVI,
  formatPercent,
  formatSignedVND,
  formatVND,
  getDebtDeadlineInfo,
} from '../utils/financeMath';
import { Modal } from './Modal';

interface DashboardViewProps {
  data: FinanceData;
  summary: FinanceSummary;
  history: BalanceHistoryPoint[];
  theme: ThemeMode;
  isSyncingMarket: boolean;
  onSyncMarket: () => void;
  onAdjustCash: (targetCurrentCash: number) => void;
  onToggleDebtStatus: (debtId: string) => void;
  onNavigate: (tab: NavTab) => void;
}

const ALLOCATION_COLORS: Record<'cash' | 'gold' | 'stocks', string> = {
  cash: '#0284c7',
  gold: '#d97706',
  stocks: '#16a34a',
};

export function DashboardView({
  data,
  summary,
  history,
  theme,
  isSyncingMarket,
  onSyncMarket,
  onAdjustCash,
  onToggleDebtStatus,
  onNavigate,
}: DashboardViewProps) {
  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [cashInput, setCashInput] = useState(String(summary.totalCash));
  const [cashError, setCashError] = useState('');

  useEffect(() => {
    const unsubscribe = syncPullFromCloud("transactions", (cloudData) => {
      // Gọi cập nhật lại dữ liệu giao dịch từ mây về app
      // (Nếu component cha của bạn truyền hàm cập nhật, hoặc nếu bạn dùng trực tiếp state truyền vào)
      if (data && typeof (data as any).setTransactions === 'function') {
        (data as any).setTransactions(cloudData);
      }
    });
    return () => unsubscribe();
  }, [data]);

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisTickColor = isDark ? '#94a3b8' : '#64748b';

  const urgentDebts = useMemo(() => {
    return data.debts
      .filter((d) => d.status === 'unpaid')
      .map((d) => ({ debt: d, info: getDebtDeadlineInfo(d) }))
      .sort((a, b) => a.info.daysRemaining - b.info.daysRemaining)
      .slice(0, 4);
  }, [data.debts]);

  const recentTransactions = useMemo(() => {
    return [...data.transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [data.transactions]);

  const lastSyncFormatted = useMemo(() => {
    try {
      const dt = new Date(data.marketLastSync);
      return dt.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' · ' + dt.toLocaleDateString('vi-VN');
    } catch {
      return 'Vừa xong';
    }
  }, [data.marketLastSync]);

  const handleOpenCashModal = () => {
    setCashInput(String(Math.round(summary.totalCash)));
    setCashError('');
    setCashModalOpen(true);
  };

  const handleSaveCash = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(cashInput.replace(/[^\d-]/g, ''));
    if (!Number.isFinite(numeric) || numeric < 0) {
      setCashError('Vui lòng nhập số tiền mặt hợp lệ (>= 0).');
      return;
    }
    onAdjustCash(numeric);
    setCashModalOpen(false);
  };

  const nonZeroAllocation = summary.allocation.filter((a) => a.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Toolbar: Market Sync Status & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {data.marketSource === 'live'
              ? 'Dữ liệu thị trường trực tiếp'
              : 'Giá thị trường tham chiếu hàng ngày'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono">Cập nhật lúc {lastSyncFormatted}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCashModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Điều chỉnh tiền mặt</span>
          </button>
          <button
            type="button"
            onClick={onSyncMarket}
            disabled={isSyncingMarket}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncingMarket ? 'animate-spin' : ''}`}
            />
            <span>{isSyncingMarket ? 'Đang cập nhật...' : 'Cập nhật giá thị trường'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid: Net Worth Focal Anchor + 4 Core Metrics */}
      <section
        aria-label="Chỉ số tài sản tổng hợp"
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Tổng tài sản ròng (Net Worth)
            </p>
            <p
              data-testid="net-worth-value"
              className="mt-1.5 font-mono text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 tabular-nums"
            >
              {formatVND(summary.netWorth)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <span>
              Lãi/Lỗ đầu tư:{' '}
              <strong
                className={`font-mono font-medium ${
                  summary.totalInvestmentPnl >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatSignedVND(summary.totalInvestmentPnl)} (
                {formatPercent(summary.totalInvestmentPnlPercent)})
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Cán cân nợ ròng:{' '}
              <strong className="font-mono font-medium text-slate-900 dark:text-slate-200">
                {formatSignedVND(summary.totalReceivables - summary.totalLiabilities)}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng tiền mặt
            </p>
            <p
              data-testid="total-cash-value"
              className="mt-1.5 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
            >
              {formatVND(summary.totalCash)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Thanh khoản sẵn có
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng giá trị đầu tư
            </p>
            <p
              data-testid="total-investments-value"
              className="mt-1.5 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums"
            >
              {formatVND(summary.totalInvestments)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono">
              Cổ phiếu {formatVND(summary.totalStockValue, true)} · Vàng{' '}
              {formatVND(summary.totalGoldValue, true)}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tổng nợ phải trả
            </p>
            <p
              data-testid="total-liabilities-value"
              className="mt-1.5 font-mono text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums"
            >
              {formatVND(summary.totalLiabilities)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Khoản tôi đang nợ chưa trả
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Người khác đang nợ
            </p>
            <p
              data-testid="total-receivables-value"
              className="mt-1.5 font-mono text-xl font-semibold text-sky-600 dark:text-sky-400 tabular-nums"
            >
              {formatVND(summary.totalReceivables)}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Khoản cho vay chưa thu hồi
            </p>
          </div>
        </div>
      </section>

      {/* Charts Section: Balance History & Asset Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Biến động số dư theo thời gian
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Xu hướng Tài sản ròng, Tiền mặt và Đầu tư 6 tháng gần nhất
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-600 dark:bg-emerald-400 inline-block" />
                Tài sản ròng
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-sky-600 dark:bg-sky-400 inline-block" />
                Tiền mặt
              </span>
            </div>
          </div>

          <div className="h-72 w-full" data-testid="balance-history-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={history}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.16} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke={axisTickColor}
                  tick={{ fontSize: 12, fill: axisTickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke={axisTickColor}
                  tick={{ fontSize: 11, fill: axisTickColor }}
                  axisLine={false}
                  tickLine={false}
                  width={68}
                  tickFormatter={(v: number) => formatVND(v, true)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload || payload.length === 0) return null;
                    return (
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 shadow-lg text-xs">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                          Tháng {label}
                        </p>
                        {payload.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-4 py-0.5"
                          >
                            <span className="text-slate-600 dark:text-slate-400">
                              {entry.name}
                            </span>
                            <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                              {formatVND(Number(entry.value ?? 0))}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="netWorth"
                  name="Tài sản ròng"
                  stroke="#16a34a"
                  strokeWidth={2}
                  fill="url(#netWorthGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="cash"
                  name="Tiền mặt"
                  stroke="#0284c7"
                  strokeWidth={1.75}
                  fill="url(#cashGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Tỷ trọng tài sản
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Phân bổ giữa Tiền mặt, Vàng và Cổ phiếu
            </p>
          </div>

          {nonZeroAllocation.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
              Chưa có dữ liệu tài sản để hiển thị biểu đồ.
            </div>
          ) : (
            <div className="h-52 w-full my-2" data-testid="allocation-chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={nonZeroAllocation}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={82}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {nonZeroAllocation.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={ALLOCATION_COLORS[entry.key]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload as (typeof nonZeroAllocation)[0];
                      return (
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 shadow-lg text-xs">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </p>
                          <p className="mt-0.5 font-mono text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatVND(item.value)} ({item.percentage.toFixed(1)}%)
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-2">
            {summary.allocation.map((item) => (
              <div
                key={item.key}
                className="py-2 flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: ALLOCATION_COLORS[item.key] }}
                  />
                  {item.name}
                </span>
                <span className="font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatVND(item.value)}{' '}
                  <span className="text-slate-500 dark:text-slate-400">
                    ({item.percentage.toFixed(1)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bottom Operational Split: Urgent Debts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Công nợ cần theo dõi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ưu tiên các khoản quá hạn hoặc sắp đến hạn trả
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('debts')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              <span>Mở sổ nợ</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {urgentDebts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Không có khoản nợ hay cho vay nào chưa tất toán.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {urgentDebts.map(({ debt, info }) => (
                <DebtSummaryRow
                  key={debt.id}
                  debt={debt}
                  deadlineLabel={info.label}
                  severity={info.severity}
                  onMarkPaid={() => onToggleDebtStatus(debt.id)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Giao dịch thu chi gần đây
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                5 bút toán mới nhất trong sổ thu chi
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline whitespace-nowrap"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Chưa có giao dịch nào được ghi chép.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="px-6 py-3.5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`p-2 rounded-lg shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {tx.description}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tx.category} · {formatDateVI(tx.date)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-sm font-semibold tabular-nums whitespace-nowrap ${
                      tx.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatVND(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Adjust Cash Modal */}
      <Modal
        open={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        title="Điều chỉnh số dư tiền mặt"
        subtitle="Cập nhật tổng tiền mặt hiện có (hệ thống tự động giữ nguyên lịch sử thu chi)"
      >
        <form onSubmit={handleSaveCash} className="space-y-4">
          <div>
            <label
              htmlFor="adjust-cash-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Số dư tiền mặt hiện tại (VND)
            </label>
            <input
              id="adjust-cash-input"
              type="number"
              min={0}
              step={1}
              value={cashInput}
              onChange={(e) => {
                setCashInput(e.target.value);
                setCashError('');
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {cashError && (
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {cashError}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCashModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold"
            >
              Lưu số dư
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function DebtSummaryRow({
  debt,
  deadlineLabel,
  severity,
  onMarkPaid,
}: {
  debt: DebtItem;
  deadlineLabel: string;
  severity: 'paid' | 'overdue' | 'upcoming' | 'normal';
  onMarkPaid: () => void;
}) {
  return (
    <div className="px-6 py-3.5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-100">
          <span className="truncate">{debt.personName}</span>
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400 shrink-0">
            · {debt.direction === 'i_owe' ? 'Tôi nợ' : 'Nợ tôi'}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Hạn {formatDateVI(debt.dueDate)}
          </span>
          <span aria-hidden="true" className="text-slate-400">
            ·
          </span>
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              severity === 'overdue'
                ? 'text-rose-600 dark:text-rose-400'
                : severity === 'upcoming'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {severity === 'overdue' && <AlertTriangle className="w-3 h-3" />}
            {severity === 'upcoming' && <Clock className="w-3 h-3" />}
            {deadlineLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`font-mono text-sm font-semibold tabular-nums ${
            debt.direction === 'i_owe'
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-sky-600 dark:text-sky-400'
          }`}
        >
          {formatVND(debt.amount)}
        </span>
        <button
          type="button"
          onClick={onMarkPaid}
          aria-label={`Đánh dấu đã trả cho khoản ${debt.personName}`}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-600 hover:border-emerald-300 dark:hover:text-emerald-400 dark:hover:border-emerald-700 transition-colors"
          title="Đánh dấu đã tất toán"
        >
          <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

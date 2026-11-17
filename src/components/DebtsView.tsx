import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  DebtDirection,
  DebtItem,
  DebtStatus,
  FinanceSummary,
} from '../types/finance';
import {
  formatDateVI,
  formatSignedVND,
  formatVND,
  getDebtDeadlineInfo,
  getTodayISO,
} from '../utils/financeMath';
import { Modal } from './Modal';

interface DebtsViewProps {
  debts: DebtItem[];
  summary: FinanceSummary;
  onSaveDebt: (debt: DebtItem) => void;
  onDeleteDebt: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

type DebtTabFilter = 'all' | DebtDirection;

export function DebtsView({
  debts,
  summary,
  onSaveDebt,
  onDeleteDebt,
  onToggleStatus,
}: DebtsViewProps) {
  const [groupFilter, setGroupFilter] = useState<DebtTabFilter>('all');
  const [hidePaid, setHidePaid] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [direction, setDirection] = useState<DebtDirection>('i_owe');
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [loanDate, setLoanDate] = useState(getTodayISO());
  const [dueDate, setDueDate] = useState(getTodayISO());
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<DebtStatus>('unpaid');
  const [error, setError] = useState('');

  const filteredDebts = useMemo(() => {
    return [...debts]
      .filter((d) => {
        if (groupFilter !== 'all' && d.direction !== groupFilter) return false;
        if (hidePaid && d.status === 'paid') return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'unpaid' ? -1 : 1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [debts, groupFilter, hidePaid]);

  const iOweCount = debts.filter((d) => d.direction === 'i_owe').length;
  const owedToMeCount = debts.filter((d) => d.direction === 'owed_to_me').length;

  const openAddModal = (defaultDir: DebtDirection = 'i_owe') => {
    setEditingId(null);
    setDirection(groupFilter === 'all' ? defaultDir : groupFilter);
    setPersonName('');
    setAmount('');
    setLoanDate(getTodayISO());
    setDueDate(getTodayISO());
    setNote('');
    setStatus('unpaid');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: DebtItem) => {
    setEditingId(item.id);
    setDirection(item.direction);
    setPersonName(item.personName);
    setAmount(String(item.amount));
    setLoanDate(item.loanDate);
    setDueDate(item.dueDate);
    setNote(item.note);
    setStatus(item.status);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!personName.trim()) {
      setError('Vui lòng nhập tên người hoặc tổ chức liên quan.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Số tiền phải lớn hơn 0.');
      return;
    }
    if (!loanDate || !dueDate) {
      setError('Vui lòng chọn ngày vay/cho vay và hạn trả.');
      return;
    }

    onSaveDebt({
      id: editingId ?? `dbt-${Date.now()}`,
      direction,
      personName: personName.trim(),
      amount: Math.round(numericAmount),
      loanDate,
      dueDate,
      note: note.trim(),
      status,
    });
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Debt KPI Summary */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tôi đang nợ (Chưa trả)
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatVND(summary.totalLiabilities)}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Người khác đang nợ tôi
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
            {formatVND(summary.totalReceivables)}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cán cân công nợ ròng
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatSignedVND(summary.totalReceivables - summary.totalLiabilities)}
          </p>
        </div>

        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cảnh báo thời hạn
          </p>
          <div className="mt-1.5 flex items-center gap-3 text-xs font-medium">
            <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              {summary.overdueDebtCount} quá hạn
            </span>
            <span className="text-slate-300 dark:text-slate-700" aria-hidden="true">
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {summary.upcomingDebtCount} sắp đến hạn
            </span>
          </div>
        </div>
      </section>

      {/* Filter Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Phân loại sổ nợ"
            className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80"
          >
            <button
              type="button"
              role="tab"
              aria-selected={groupFilter === 'all'}
              onClick={() => setGroupFilter('all')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                groupFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tất cả ({debts.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={groupFilter === 'i_owe'}
              onClick={() => setGroupFilter('i_owe')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                groupFilter === 'i_owe'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tôi đang nợ ai ({iOweCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={groupFilter === 'owed_to_me'}
              onClick={() => setGroupFilter('owed_to_me')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                groupFilter === 'owed_to_me'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Ai đang nợ tôi ({owedToMeCount})
            </button>
          </div>

          <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={hidePaid}
              onChange={(e) => setHidePaid(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <span>Ẩn khoản đã trả</span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => openAddModal()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm khoản nợ / cho vay</span>
        </button>
      </div>

      {/* Debts Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {groupFilter === 'i_owe'
              ? 'Danh sách khoản tôi đang nợ'
              : groupFilter === 'owed_to_me'
                ? 'Danh sách khoản người khác đang nợ tôi'
                : 'Toàn bộ công nợ & cho vay'}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {filteredDebts.length} khoản
          </span>
        </div>

        {filteredDebts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Không có khoản nợ hoặc cho vay nào trong mục này.
            </p>
            <button
              type="button"
              onClick={() => openAddModal()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm khoản mới</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-6">Đối tượng & Ghi chú</th>
                  <th className="py-3 px-4">Nhóm</th>
                  <th className="py-3 px-4">Ngày vay</th>
                  <th className="py-3 px-4">Hạn trả</th>
                  <th className="py-3 px-4">Tình trạng hạn</th>
                  <th className="py-3 px-4 text-right">Số tiền</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filteredDebts.map((debt) => {
                  const deadline = getDebtDeadlineInfo(debt);
                  const isPaid = debt.status === 'paid';

                  return (
                    <tr
                      key={debt.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isPaid ? 'opacity-65' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {debt.personName}
                        </div>
                        {debt.note && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[260px] truncate">
                            {debt.note}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium whitespace-nowrap">
                        <span
                          className={
                            debt.direction === 'i_owe'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }
                        >
                          {debt.direction === 'i_owe'
                            ? 'Tôi đang nợ'
                            : 'Nợ tôi'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateVI(debt.loanDate)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        {formatDateVI(debt.dueDate)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span
                          className={`inline-flex items-center gap-1.5 font-medium ${
                            deadline.severity === 'overdue'
                              ? 'text-rose-600 dark:text-rose-400'
                              : deadline.severity === 'upcoming'
                                ? 'text-amber-600 dark:text-amber-400'
                                : deadline.severity === 'paid'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {deadline.severity === 'overdue' && (
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {deadline.severity === 'upcoming' && (
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                          )}
                          {deadline.severity === 'paid' && (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span>{deadline.label}</span>
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono tabular-nums font-semibold whitespace-nowrap ${
                          debt.direction === 'i_owe'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-sky-600 dark:text-sky-400'
                        }`}
                      >
                        {formatVND(debt.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(debt.id)}
                          aria-label={`Đổi trạng thái khoản ${debt.personName} thành ${
                            isPaid ? 'Chưa trả' : 'Đã trả'
                          }`}
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
                            isPaid
                              ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/70'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
                          }`}
                        >
                          {isPaid ? 'Đã trả' : 'Chưa trả'}
                        </button>
                      </td>
                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(debt)}
                            aria-label={`Chỉnh sửa khoản công nợ ${debt.personName}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDebt(debt.id)}
                            aria-label={`Xóa khoản công nợ ${debt.personName}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Add/Edit Debt Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editingId ? 'Cập nhật khoản công nợ' : 'Thêm khoản nợ / cho vay mới'
        }
        subtitle="Theo dõi hạn trả và tự động cảnh báo các khoản sắp đến hạn hoặc quá hạn"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nhóm công nợ
            </span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setDirection('i_owe')}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  direction === 'i_owe'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tôi đang nợ ai
              </button>
              <button
                type="button"
                onClick={() => setDirection('owed_to_me')}
                className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                  direction === 'owed_to_me'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Ai đang nợ tôi
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="debt-person-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Tên người / Đối tượng
              </label>
              <input
                id="debt-person-input"
                type="text"
                placeholder="VD: Nguyễn Văn A, Ngân hàng..."
                value={personName}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="debt-amount-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Số tiền (VND)
              </label>
              <input
                id="debt-amount-input"
                type="number"
                min={1}
                step={1}
                placeholder="5000000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="debt-loan-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Ngày vay / cho vay
              </label>
              <input
                id="debt-loan-date"
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="debt-due-date"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Hạn trả (Deadline)
              </label>
              <input
                id="debt-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="debt-status-select"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Trạng thái
              </label>
              <select
                id="debt-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as DebtStatus)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="unpaid">Chưa trả</option>
                <option value="paid">Đã trả</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="debt-note-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Ghi chú
            </label>
            <input
              id="debt-note-input"
              type="text"
              placeholder="Lý do vay, hình thức thanh toán..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold"
            >
              {editingId ? 'Lưu thay đổi' : 'Lưu khoản mục'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

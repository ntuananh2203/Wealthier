import React, { useEffect, useState } from 'react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../data/seedData';
import { Transaction, TransactionType } from '../types/finance';
import { getTodayISO } from '../utils/financeMath';
import { Modal } from './Modal';

interface TransactionModalProps {
  open: boolean;
  editingTransaction: Transaction | null;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
}

export function TransactionModal({
  open,
  editingTransaction,
  onClose,
  onSave,
}: TransactionModalProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [date, setDate] = useState(getTodayISO());
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editingTransaction) {
      setType(editingTransaction.type);
      setDate(editingTransaction.date);
      setCategory(editingTransaction.category);
      setAmount(String(editingTransaction.amount));
      setDescription(editingTransaction.description);
    } else {
      setType('expense');
      setDate(getTodayISO());
      setCategory(EXPENSE_CATEGORIES[0]);
      setAmount('');
      setDescription('');
    }
    setError('');
  }, [open, editingTransaction]);

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    const nextCats =
      nextType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!nextCats.includes(category as never)) {
      setCategory(nextCats[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(amount);
    if (!date) {
      setError('Vui lòng chọn ngày giao dịch.');
      return;
    }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Số tiền phải lớn hơn 0.');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng nhập nội dung ghi chú cho giao dịch.');
      return;
    }

    onSave({
      id: editingTransaction?.id ?? `tx-${Date.now()}`,
      date,
      type,
      category,
      description: description.trim(),
      amount: Math.round(numericAmount),
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTransaction ? 'Chỉnh sửa giao dịch' : 'Ghi chép thu chi mới'}
      subtitle="Các khoản thu chi tự động cập nhật vào Tổng tiền mặt trên bảng điều khiển"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Loại giao dịch
          </span>
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Chi tiêu
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Thu nhập
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="tx-date-input"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Ngày giao dịch
            </label>
            <input
              id="tx-date-input"
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError('');
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label
              htmlFor="tx-category-select"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Danh mục
            </label>
            <select
              id="tx-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="tx-amount-input"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Số tiền (VND)
          </label>
          <input
            id="tx-amount-input"
            type="number"
            min={1000}
            step={1000}
            placeholder="150000"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label
            htmlFor="tx-desc-input"
            className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Mô tả / Ghi chú
          </label>
          <input
            id="tx-desc-input"
            type="text"
            placeholder="VD: Ăn trưa văn phòng, Lương tháng..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setError('');
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {error && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Hủy
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold"
          >
            {editingTransaction ? 'Lưu thay đổi' : 'Lưu giao dịch'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

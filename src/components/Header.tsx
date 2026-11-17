import React from 'react';
import { Menu, Moon, Plus, Sun } from 'lucide-react';
import { NavTab, ThemeMode } from '../types/finance';

interface HeaderProps {
  activeTab: NavTab;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenMobileMenu: () => void;
  onQuickAddTransaction: () => void;
}

const TAB_TITLES: Record<NavTab, string> = {
  dashboard: 'Tổng quan tài chính',
  portfolio: 'Danh mục đầu tư',
  transactions: 'Sổ thu chi',
  debts: 'Quản lý sổ nợ',
};

export function Header({
  activeTab,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
  onQuickAddTransaction,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-8">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Mở menu điều hướng"
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="hidden sm:inline text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Wealthier
            </span>
            <span
              className="hidden sm:inline text-slate-300 dark:text-slate-700"
              aria-hidden="true"
            >
              /
            </span>
            <h1 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {TAB_TITLES[activeTab]}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={
              theme === 'dark'
                ? 'Chuyển sang giao diện sáng'
                : 'Chuyển sang giao diện tối'
            }
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors whitespace-nowrap shrink-0"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Sáng</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline">Tối</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onQuickAddTransaction}
            className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thu chi</span>
          </button>
        </div>
      </div>
    </header>
  );
}

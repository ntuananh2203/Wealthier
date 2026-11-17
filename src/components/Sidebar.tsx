import React from 'react';
import {
  ArrowLeftRight,
  BriefcaseBusiness,
  HandCoins,
  LayoutDashboard,
  RotateCcw,
  X,
} from 'lucide-react';
import { NavTab } from '../types/finance';
import { formatVND } from '../utils/financeMath';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  netWorth: number;
  alertDebtCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onResetDemo: () => void;
}

const NAV_ITEMS: Array<{
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'portfolio', label: 'Đầu tư', icon: BriefcaseBusiness },
  { id: 'transactions', label: 'Sổ thu chi', icon: ArrowLeftRight },
  { id: 'debts', label: 'Sổ nợ', icon: HandCoins },
];

export function Sidebar({
  activeTab,
  onSelectTab,
  netWorth,
  alertDebtCount,
  mobileOpen,
  onCloseMobile,
  onResetDemo,
}: SidebarProps) {
  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        <div className="flex items-center justify-between px-2 py-2 mb-6">
          <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
            Wealthier
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Điều hướng chính" className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-950'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.id === 'debts' && alertDebtCount > 0 && (
                  <span
                    className={`font-mono text-xs ${
                      isActive
                        ? 'text-emerald-100 dark:text-slate-900'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {alertDebtCount} lưu ý
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        <div className="px-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tài sản ròng hiện tại
          </p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatVND(netWorth)}
          </p>
        </div>
        <button
          type="button"
          onClick={onResetDemo}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
          <span>Khôi phục dữ liệu mẫu</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-screen">
        <div className="sticky top-0 h-screen">{navContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

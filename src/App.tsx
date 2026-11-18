import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardView } from './components/DashboardView';
import { DebtsView } from './components/DebtsView';
import { Header } from './components/Header';
import { PortfolioView } from './components/PortfolioView';
import { Sidebar } from './components/Sidebar';
import { TransactionModal } from './components/TransactionModal';
import { TransactionsView } from './components/TransactionsView';
import { syncMarketPrices } from './services/marketPrices';
import { syncPullFromCloud, deleteFromCloud } from './services/cloudSync';
import {
  DebtItem,
  FinanceData,
  GoldHolding,
  NavTab,
  StockHolding,
  ThemeMode,
  Transaction,
} from './types/finance';
import {
  buildBalanceHistory,
  calculateFinanceSummary,
} from './utils/financeMath';
import {
  loadFinanceData,
  loadThemeMode,
  resetFinanceData,
  saveFinanceData,
  saveThemeMode,
} from './utils/storage';

export default function App() {
  const [data, setData] = useState<FinanceData>(() => loadFinanceData());
  const [theme, setTheme] = useState<ThemeMode>(() => loadThemeMode());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSyncingMarket, setIsSyncingMarket] = useState(false);
  const latestDataRef = useRef<FinanceData>(data);

  // Shared transaction modal (reachable from Header CTA and Transactions view)
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);
  
  useEffect(() => {
    const unsubscribe = syncPullFromCloud("transactions", (cloudTransactions) => {
      setData((prev) => ({
        ...prev,
        transactions: cloudTransactions,
      }));
    });

    return () => unsubscribe();
  }, []);
  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveThemeMode(theme);
  }, [theme]);

  // Persist finance data to localStorage on every update
  useEffect(() => {
    saveFinanceData(data);
  }, [data]);

  const summary = useMemo(() => calculateFinanceSummary(data), [data]);
  const history = useMemo(() => buildBalanceHistory(data), [data]);

  const handleSyncMarket = useCallback(async () => {
    setIsSyncingMarket(true);
    try {
      const snapshot = latestDataRef.current;
      const result = await syncMarketPrices(snapshot.stocks, snapshot.gold);
      const stockMap = new Map(result.stocks.map((s) => [s.id, s]));
      const goldMap = new Map(result.gold.map((g) => [g.id, g]));

      setData((prev) => ({
        ...prev,
        stocks: prev.stocks.map((s) => stockMap.get(s.id) ?? s),
        gold: prev.gold.map((g) => goldMap.get(g.id) ?? g),
        marketLastSync: result.syncedAt,
        marketSource: result.source,
      }));
    } finally {
      setIsSyncingMarket(false);
    }
  }, []);

  // Automatically fetch real-time stock & gold prices on load and every 60 seconds
  useEffect(() => {
    void handleSyncMarket();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void handleSyncMarket();
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [handleSyncMarket]);

  const handleAdjustCash = (targetCurrentCash: number) => {
    const txNet = data.transactions.reduce(
      (sum, tx) => (tx.type === 'income' ? sum + tx.amount : sum - tx.amount),
      0
    );
    setData((prev) => ({
      ...prev,
      openingCash: targetCurrentCash - txNet,
    }));
  };

  const handleSaveStock = (stock: StockHolding) => {
    setData((prev) => {
      const exists = prev.stocks.some((s) => s.id === stock.id);
      return {
        ...prev,
        stocks: exists
          ? prev.stocks.map((s) => (s.id === stock.id ? stock : s))
          : [stock, ...prev.stocks],
      };
    });
  };

  const handleDeleteStock = async (id: string) => {
    setData((prev) => ({
      ...prev,
      stocks: prev.stocks.filter((s) => s.id !== id),
    }));
    await deleteFromCloud("stocks", id);
  };

  const handleSaveGold = (item: GoldHolding) => {
    setData((prev) => {
      const exists = prev.gold.some((g) => g.id === item.id);
      return {
        ...prev,
        gold: exists
          ? prev.gold.map((g) => (g.id === item.id ? item : g))
          : [item, ...prev.gold],
      };
    });
  };

  const handleDeleteGold = (id: string) => {
    setData((prev) => ({
      ...prev,
      gold: prev.gold.filter((g) => g.id !== id),
    }));
  };

  const handleSaveTransaction = (tx: Transaction) => {
    setData((prev) => {
      const exists = prev.transactions.some((t) => t.id === tx.id);
      return {
        ...prev,
        transactions: exists
          ? prev.transactions.map((t) => (t.id === tx.id ? tx : t))
          : [tx, ...prev.transactions],
      };
    });
  };
// Hàm xóa transaction
//

  const handleDeleteTransaction = async (id: string) => {
    // 1. Cập nhật state cục bộ để giao diện mất đi ngay lập tức
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));

    // 2. Gọi lệnh xóa vĩnh viễn trên Firebase Cloud
    await deleteFromCloud("transactions", id);
  };

  const handleSaveDebt = (debt: DebtItem) => {
    setData((prev) => {
      const exists = prev.debts.some((d) => d.id === debt.id);
      return {
        ...prev,
        debts: exists
          ? prev.debts.map((d) => (d.id === debt.id ? debt : d))
          : [debt, ...prev.debts],
      };
    });
  };

  const handleDeleteDebt = async (id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.filter((d) => d.id !== id),
    }));
    await deleteFromCloud("debts", id);
  };

  const handleToggleDebtStatus = (id: string) => {
    setData((prev) => ({
      ...prev,
      debts: prev.debts.map((d) =>
        d.id === id
          ? { ...d, status: d.status === 'paid' ? 'unpaid' : 'paid' }
          : d
      ),
    }));
  };

  const handleResetDemo = () => {
    const fresh = resetFinanceData();
    latestDataRef.current = fresh;
    setData(fresh);
    void handleSyncMarket();
  };

  const openQuickAddTransaction = () => {
    setEditingTx(null);
    setTxModalOpen(true);
  };

  const openEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalOpen(true);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        netWorth={summary.netWorth}
        alertDebtCount={summary.overdueDebtCount + summary.upcomingDebtCount}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onResetDemo={handleResetDemo}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          activeTab={activeTab}
          theme={theme}
          onToggleTheme={() =>
            setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
          }
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onQuickAddTransaction={openQuickAddTransaction}
        />

        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={data}
              summary={summary}
              history={history}
              theme={theme}
              isSyncingMarket={isSyncingMarket}
              onSyncMarket={handleSyncMarket}
              onAdjustCash={handleAdjustCash}
              onToggleDebtStatus={handleToggleDebtStatus}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'portfolio' && (
            <PortfolioView
              stocks={data.stocks}
              gold={data.gold}
              summary={summary}
              marketLastSync={data.marketLastSync}
              marketSource={data.marketSource}
              isSyncingMarket={isSyncingMarket}
              onSyncMarket={handleSyncMarket}
              onSaveStock={handleSaveStock}
              onDeleteStock={handleDeleteStock}
              onSaveGold={handleSaveGold}
              onDeleteGold={handleDeleteGold}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={data.transactions}
              onAddTransaction={openQuickAddTransaction}
              onEditTransaction={openEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'debts' && (
            <DebtsView
              debts={data.debts}
              summary={summary}
              onSaveDebt={handleSaveDebt}
              onDeleteDebt={handleDeleteDebt}
              onToggleStatus={handleToggleDebtStatus}
            />
          )}
        </main>
      </div>

      <TransactionModal
        open={txModalOpen}
        editingTransaction={editingTx}
        onClose={() => setTxModalOpen(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}

import React, { useRef, useState } from 'react';
import {
  Coins,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { GOLD_BENCHMARKS, STOCK_DIRECTORY } from '../data/seedData';
import {
  fetchLiveStockQuote,
  getReferenceGoldPrice,
  getReferenceStockInfo,
} from '../services/marketPrices';
import {
  FinanceSummary,
  GoldHolding,
  GoldUnit,
  PortfolioSubTab,
  StockHolding,
} from '../types/finance';
import {
  calculateGoldMetrics,
  calculateStockMetrics,
  formatPercent,
  formatSignedVND,
  formatVND,
} from '../utils/financeMath';
import { Modal } from './Modal';

interface PortfolioViewProps {
  stocks: StockHolding[];
  gold: GoldHolding[];
  summary: FinanceSummary;
  marketLastSync: string;
  marketSource: 'live' | 'simulated';
  isSyncingMarket: boolean;
  onSyncMarket: () => void;
  onSaveStock: (stock: StockHolding) => void;
  onDeleteStock: (id: string) => void;
  onSaveGold: (item: GoldHolding) => void;
  onDeleteGold: (id: string) => void;
}

export function PortfolioView({
  stocks,
  gold,
  summary,
  marketLastSync,
  marketSource,
  isSyncingMarket,
  onSyncMarket,
  onSaveStock,
  onDeleteStock,
  onSaveGold,
  onDeleteGold,
}: PortfolioViewProps) {
  const [subTab, setSubTab] = useState<PortfolioSubTab>('stocks');
  const latestSymbolLookupRef = useRef<string>('');

  // Stock modal state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockSymbol, setStockSymbol] = useState('');
  const [stockName, setStockName] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockAvgCost, setStockAvgCost] = useState('');
  const [stockCurrentPrice, setStockCurrentPrice] = useState('');
  const [stockError, setStockError] = useState('');

  // Gold modal state
  const [goldModalOpen, setGoldModalOpen] = useState(false);
  const [editingGoldId, setEditingGoldId] = useState<string | null>(null);
  const [goldType, setGoldType] = useState('Vàng nhẫn 9999');
  const [goldUnit, setGoldUnit] = useState<GoldUnit>('chỉ');
  const [goldQuantity, setGoldQuantity] = useState('');
  const [goldBuyPrice, setGoldBuyPrice] = useState('');
  const [goldMarketPrice, setGoldMarketPrice] = useState('');
  const [goldError, setGoldError] = useState('');

  const openAddStock = () => {
    setEditingStockId(null);
    setStockSymbol('');
    setStockName('');
    setStockQuantity('');
    setStockAvgCost('');
    setStockCurrentPrice('');
    setStockError('');
    setStockModalOpen(true);
  };

  const openEditStock = (item: StockHolding) => {
    setEditingStockId(item.id);
    setStockSymbol(item.symbol);
    setStockName(item.name);
    setStockQuantity(String(item.quantity));
    setStockAvgCost(String(item.avgCost));
    setStockCurrentPrice(String(item.currentPrice));
    setStockError('');
    setStockModalOpen(true);
  };

  const handleSymbolChange = (val: string) => {
    const upper = val.toUpperCase();
    const trimmed = upper.trim();
    setStockSymbol(upper);
    setStockError('');
    latestSymbolLookupRef.current = trimmed;

    if (!editingStockId && trimmed.length >= 2) {
      const info = getReferenceStockInfo(trimmed);
      setStockName(info.name);
      setStockCurrentPrice(String(info.price));

      if (trimmed.length >= 3) {
        void fetchLiveStockQuote(trimmed).then((live) => {
          if (!live || latestSymbolLookupRef.current !== trimmed) return;
          setStockCurrentPrice(String(live.price));
          if (live.name && !STOCK_DIRECTORY[trimmed]) {
            setStockName(live.name);
          }
        });
      }
    }
  };

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sym = stockSymbol.trim().toUpperCase();
    const qty = Number(stockQuantity);
    const avg = Number(stockAvgCost);
    const curr = Number(stockCurrentPrice);

    if (!sym || sym.length < 2) {
      setStockError('Vui lòng nhập mã cổ phiếu hợp lệ (ví dụ: VCB, MBB, HPG).');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setStockError('Số lượng cổ phiếu phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(avg) || avg <= 0) {
      setStockError('Giá vốn trung bình phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(curr) || curr <= 0) {
      setStockError('Giá thị trường phải lớn hơn 0.');
      return;
    }

    const existing = editingStockId
      ? stocks.find((s) => s.id === editingStockId)
      : undefined;

    onSaveStock({
      id: editingStockId ?? `stk-${Date.now()}`,
      symbol: sym,
      name: stockName.trim() || getReferenceStockInfo(sym).name,
      quantity: qty,
      avgCost: avg,
      currentPrice: curr,
      prevClose: existing ? existing.prevClose : curr,
      lastUpdated: new Date().toISOString(),
    });
    setStockModalOpen(false);
  };

  const openAddGold = () => {
    setEditingGoldId(null);
    const defaultType = 'Vàng nhẫn 9999';
    const defaultUnit: GoldUnit = 'chỉ';
    setGoldType(defaultType);
    setGoldUnit(defaultUnit);
    setGoldQuantity('');
    setGoldBuyPrice('');
    setGoldMarketPrice(String(getReferenceGoldPrice(defaultType, defaultUnit)));
    setGoldError('');
    setGoldModalOpen(true);
  };

  const openEditGold = (item: GoldHolding) => {
    setEditingGoldId(item.id);
    setGoldType(item.type);
    setGoldUnit(item.unit);
    setGoldQuantity(String(item.quantity));
    setGoldBuyPrice(String(item.buyPrice));
    setGoldMarketPrice(String(item.currentMarketPrice));
    setGoldError('');
    setGoldModalOpen(true);
  };

  const handleGoldTypeOrUnitChange = (nextType: string, nextUnit: GoldUnit) => {
    setGoldType(nextType);
    setGoldUnit(nextUnit);
    setGoldError('');
    if (!editingGoldId) {
      setGoldMarketPrice(String(getReferenceGoldPrice(nextType, nextUnit)));
    }
  };

  const handleGoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeTrimmed = goldType.trim();
    const qty = Number(goldQuantity);
    const buy = Number(goldBuyPrice);
    const market = Number(goldMarketPrice);

    if (!typeTrimmed) {
      setGoldError('Vui lòng nhập hoặc chọn loại vàng.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setGoldError('Khối lượng vàng phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(buy) || buy <= 0) {
      setGoldError('Giá mua vào phải lớn hơn 0.');
      return;
    }
    if (!Number.isFinite(market) || market <= 0) {
      setGoldError('Giá thị trường hiện tại phải lớn hơn 0.');
      return;
    }

    onSaveGold({
      id: editingGoldId ?? `gld-${Date.now()}`,
      type: typeTrimmed,
      unit: goldUnit,
      quantity: qty,
      buyPrice: buy,
      currentMarketPrice: market,
      lastUpdated: new Date().toISOString(),
    });
    setGoldModalOpen(false);
  };

  const activeTotalCost =
    subTab === 'stocks' ? summary.totalStockCost : summary.totalGoldCost;
  const activeMarketValue =
    subTab === 'stocks' ? summary.totalStockValue : summary.totalGoldValue;
  const activePnl =
    subTab === 'stocks' ? summary.totalStockPnl : summary.totalGoldPnl;
  const activePnlPct =
    subTab === 'stocks'
      ? summary.totalStockPnlPercent
      : summary.totalGoldPnlPercent;

  return (
    <div className="space-y-6">
      {/* Segmented Sub-tabs + Market Sync & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div
          role="tablist"
          aria-label="Phân loại tài sản đầu tư"
          className="inline-flex items-center p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 w-fit"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'stocks'}
            onClick={() => setSubTab('stocks')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'stocks'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cổ phiếu ({stocks.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'gold'}
            onClick={() => setSubTab('gold')}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
              subTab === 'gold'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Vàng ({gold.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSyncMarket}
            disabled={isSyncingMarket}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isSyncingMarket ? 'animate-spin' : ''}`}
            />
            <span>
              {isSyncingMarket ? 'Đang cập nhật...' : 'Cập nhật giá thị trường'}
            </span>
          </button>

          <button
            type="button"
            onClick={subTab === 'stocks' ? openAddStock : openAddGold}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{subTab === 'stocks' ? 'Thêm cổ phiếu' : 'Thêm vàng'}</span>
          </button>
        </div>
      </div>

      {/* Portfolio KPI Summary Strip */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng vốn đầu tư ({subTab === 'stocks' ? 'Cổ phiếu' : 'Vàng'})
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatVND(activeTotalCost)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Giá trị thị trường hiện tại
          </p>
          <p className="mt-1.5 font-mono text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatVND(activeMarketValue)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tổng lãi / lỗ tạm tính
          </p>
          <p
            className={`mt-1.5 font-mono text-xl font-semibold tabular-nums ${
              activePnl >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatSignedVND(activePnl)}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hiệu suất sinh lời (%)
          </p>
          <p
            className={`mt-1.5 font-mono text-xl font-semibold tabular-nums ${
              activePnlPct >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatPercent(activePnlPct)}
          </p>
        </div>
      </section>

      {/* Stocks or Gold Table */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {subTab === 'stocks'
              ? 'Danh mục cổ phiếu nắm giữ'
              : 'Danh mục vàng tích trữ'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {marketSource === 'live' ? 'Nguồn trực tiếp' : 'Mô phỏng thị trường'} ·{' '}
            {new Date(marketLastSync).toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>

        {subTab === 'stocks' ? (
          stocks.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bạn chưa thêm mã cổ phiếu nào vào danh mục.
              </p>
              <button
                type="button"
                onClick={openAddStock}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm cổ phiếu đầu tiên</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">Mã CP</th>
                    <th className="py-3 px-4 text-right">Số lượng</th>
                    <th className="py-3 px-4 text-right">Giá vốn TB</th>
                    <th className="py-3 px-4 text-right">Giá thị trường</th>
                    <th className="py-3 px-4 text-right">Giá trị hiện tại</th>
                    <th className="py-3 px-4 text-right">Lãi / Lỗ</th>
                    <th className="py-3 px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {stocks.map((stock) => {
                    const m = calculateStockMetrics(stock);
                    return (
                      <tr
                        key={stock.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                            {stock.symbol}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] truncate">
                            {stock.name}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {stock.quantity.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {formatVND(stock.avgCost)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          <div className="text-slate-900 dark:text-slate-100 font-medium">
                            {formatVND(stock.currentPrice)}
                          </div>
                          <div
                            className={`text-xs ${
                              m.dayChangePercent >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatPercent(m.dayChangePercent)} hôm nay
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                          {formatVND(m.marketValue)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          <div
                            className={`font-semibold ${
                              m.pnl >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatSignedVND(m.pnl)}
                          </div>
                          <div
                            className={`text-xs ${
                              m.pnlPercent >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatPercent(m.pnlPercent)}
                          </div>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditStock(stock)}
                              aria-label={`Chỉnh sửa cổ phiếu ${stock.symbol}`}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteStock(stock.id)}
                              aria-label={`Xóa cổ phiếu ${stock.symbol}`}
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
          )
        ) : gold.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Bạn chưa ghi nhận khoản tích trữ vàng nào.
            </p>
            <button
              type="button"
              onClick={openAddGold}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm vàng đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-6">Loại vàng</th>
                  <th className="py-3 px-4 text-right">Khối lượng</th>
                  <th className="py-3 px-4 text-right">Giá mua vào</th>
                  <th className="py-3 px-4 text-right">Giá thị trường</th>
                  <th className="py-3 px-4 text-right">Giá trị hiện tại</th>
                  <th className="py-3 px-4 text-right">Lãi / Lỗ</th>
                  <th className="py-3 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {gold.map((item) => {
                  const m = calculateGoldMetrics(item);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {item.type}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Đơn vị: {item.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {item.quantity.toLocaleString('vi-VN')} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatVND(item.buyPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {formatVND(item.currentMarketPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
                        {formatVND(m.marketValue)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                        <div
                          className={`font-semibold ${
                            m.pnl >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatSignedVND(m.pnl)}
                        </div>
                        <div
                          className={`text-xs ${
                            m.pnlPercent >= 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {formatPercent(m.pnlPercent)}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditGold(item)}
                            aria-label={`Chỉnh sửa ${item.type}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteGold(item.id)}
                            aria-label={`Xóa ${item.type}`}
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

      {/* Stock Add/Edit Modal */}
      <Modal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title={editingStockId ? 'Cập nhật cổ phiếu' : 'Thêm cổ phiếu vào danh mục'}
        subtitle="Nhập mã chứng khoán Việt Nam (VD: VNM, MBB, VCB, PC1, HPG) để tự động tra cứu giá tham chiếu"
      >
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stock-symbol-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Mã cổ phiếu
              </label>
              <input
                id="stock-symbol-input"
                type="text"
                list="vn-stock-list"
                placeholder="VCB, HPG, FPT..."
                value={stockSymbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="vn-stock-list">
                {Object.keys(STOCK_DIRECTORY).map((sym) => (
                  <option key={sym} value={sym}>
                    {STOCK_DIRECTORY[sym].name}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="stock-name-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Tên doanh nghiệp
              </label>
              <input
                id="stock-name-input"
                type="text"
                placeholder="Tự động điền hoặc tự nhập"
                value={stockName}
                onChange={(e) => setStockName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="stock-qty-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Số lượng (CP)
              </label>
              <input
                id="stock-qty-input"
                type="number"
                min={1}
                step={1}
                placeholder="500"
                value={stockQuantity}
                onChange={(e) => {
                  setStockQuantity(e.target.value);
                  setStockError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="stock-cost-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Giá vốn TB (₫)
              </label>
              <input
                id="stock-cost-input"
                type="number"
                min={1}
                step={1}
                placeholder="26500"
                value={stockAvgCost}
                onChange={(e) => {
                  setStockAvgCost(e.target.value);
                  setStockError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="stock-price-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Giá thị trường (₫)
              </label>
              <input
                id="stock-price-input"
                type="number"
                min={1}
                step={1}
                placeholder="27300"
                value={stockCurrentPrice}
                onChange={(e) => {
                  setStockCurrentPrice(e.target.value);
                  setStockError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {stockError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {stockError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStockModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold"
            >
              {editingStockId ? 'Lưu thay đổi' : 'Thêm cổ phiếu'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Gold Add/Edit Modal */}
      <Modal
        open={goldModalOpen}
        onClose={() => setGoldModalOpen(false)}
        title={editingGoldId ? 'Cập nhật khoản vàng' : 'Thêm vàng vào danh mục'}
        subtitle="Theo dõi vàng nhẫn 9999, vàng miếng SJC theo chỉ hoặc lượng"
      >
        <form onSubmit={handleGoldSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="gold-type-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Loại vàng
              </label>
              <input
                id="gold-type-input"
                type="text"
                list="gold-type-list"
                value={goldType}
                onChange={(e) =>
                  handleGoldTypeOrUnitChange(e.target.value, goldUnit)
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="gold-type-list">
                {Object.keys(GOLD_BENCHMARKS).map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>

            <div>
              <label
                htmlFor="gold-unit-select"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Đơn vị tính
              </label>
              <select
                id="gold-unit-select"
                value={goldUnit}
                onChange={(e) =>
                  handleGoldTypeOrUnitChange(
                    goldType,
                    e.target.value as GoldUnit
                  )
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="chỉ">Chỉ</option>
                <option value="lượng">Lượng (10 chỉ)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="gold-qty-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Khối lượng ({goldUnit})
              </label>
              <input
                id="gold-qty-input"
                type="number"
                min={0.1}
                step="0.1"
                placeholder="5"
                value={goldQuantity}
                onChange={(e) => {
                  setGoldQuantity(e.target.value);
                  setGoldError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="gold-buy-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Giá mua vào (₫/{goldUnit})
              </label>
              <input
                id="gold-buy-input"
                type="number"
                min={1}
                step={1}
                placeholder="8300000"
                value={goldBuyPrice}
                onChange={(e) => {
                  setGoldBuyPrice(e.target.value);
                  setGoldError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label
                htmlFor="gold-market-input"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Giá thị trường (₫/{goldUnit})
              </label>
              <input
                id="gold-market-input"
                type="number"
                min={1}
                step={1}
                placeholder="8480000"
                value={goldMarketPrice}
                onChange={(e) => {
                  setGoldMarketPrice(e.target.value);
                  setGoldError('');
                }}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {goldError && (
            <p className="text-xs text-rose-600 dark:text-rose-400">
              {goldError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setGoldModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs font-semibold"
            >
              {editingGoldId ? 'Lưu thay đổi' : 'Thêm vàng'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

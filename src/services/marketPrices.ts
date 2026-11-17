import { GOLD_BENCHMARKS, STOCK_DIRECTORY } from '../data/seedData';
import { GoldHolding, GoldUnit, StockHolding } from '../types/finance';

export function getReferenceStockInfo(symbol: string): {
  name: string;
  price: number;
} {
  const clean = symbol.trim().toUpperCase();
  if (STOCK_DIRECTORY[clean]) {
    return {
      name: STOCK_DIRECTORY[clean].name,
      price: STOCK_DIRECTORY[clean].basePrice,
    };
  }
  return {
    name: `Cổ phiếu ${clean}`,
    price: 50000,
  };
}

export async function fetchLiveStockQuote(symbol: string): Promise<{
  symbol: string;
  price: number;
  prevClose: number;
  name?: string;
} | null> {
  const clean = symbol.trim().toUpperCase();
  if (clean.length < 2) return null;
  try {
    const res = await fetch(
      `/api/stock-quote?symbol=${encodeURIComponent(clean)}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      symbol?: string;
      price?: number;
      prevClose?: number;
      name?: string;
    };
    if (typeof data.price === 'number' && data.price > 0) {
      return {
        symbol: data.symbol || clean,
        price: data.price,
        prevClose: data.prevClose || data.price,
        name: data.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function resolveGoldApiCode(type: string): string {
  const lower = type.toLowerCase();
  if (lower.includes('sjc')) return 'SJC';
  if (lower.includes('985')) return '985';
  if (lower.includes('980')) return '980';
  if (lower.includes('950')) return '950';
  if (lower.includes('750') || lower.includes('18k')) return '750';
  if (lower.includes('680')) return '680';
  if (lower.includes('610') || lower.includes('14k')) return '610';
  return '999';
}

export function getReferenceGoldPrice(type: string, unit: GoldUnit): number {
  const perChi = GOLD_BENCHMARKS[type] ?? 13_620_000;
  return unit === 'lượng' ? perChi * 10 : perChi;
}

export interface MarketSyncResult {
  stocks: StockHolding[];
  gold: GoldHolding[];
  syncedAt: string;
  source: 'live' | 'simulated';
}

interface BackendMarketResponse {
  stocks?: Record<
    string,
    { price: number; prevClose: number; name?: string; live: boolean }
  >;
  gold?: Record<
    string,
    { buyPrice: number; sellPrice: number; dateTime: string }
  >;
  fetchedAt?: string;
  liveStocksCount?: number;
  liveGoldAvailable?: boolean;
}

/**
 * Fetches real-time Vietnamese stock quotes (HOSE/HNX via server proxy) and
 * live domestic gold prices (Mi Hong SJC / 9999 via server proxy).
 */
export async function syncMarketPrices(
  stocks: StockHolding[],
  gold: GoldHolding[]
): Promise<MarketSyncResult> {
  const symbols = stocks.map((s) => s.symbol.trim().toUpperCase()).filter(Boolean);

  try {
    const query = encodeURIComponent(symbols.join(','));
    const res = await fetch(`/api/market-prices?symbols=${query}`);
    if (res.ok) {
      const payload = (await res.json()) as BackendMarketResponse;
      const syncedAt = payload.fetchedAt || new Date().toISOString();
      const liveStocks = payload.stocks || {};
      const liveGold = payload.gold || {};
      const hasLiveData =
        (payload.liveStocksCount ?? 0) > 0 || Boolean(payload.liveGoldAvailable);

      const updatedStocks = stocks.map((stock) => {
        const sym = stock.symbol.trim().toUpperCase();
        const quote = liveStocks[sym];
        if (quote && quote.price > 0) {
          return {
            ...stock,
            currentPrice: quote.price,
            prevClose: quote.prevClose > 0 ? quote.prevClose : stock.currentPrice,
            lastUpdated: syncedAt,
          };
        }
        return stock;
      });

      const updatedGold = gold.map((item) => {
        const code = resolveGoldApiCode(item.type);
        const liveQuote = liveGold[code] || liveGold['999'];
        if (liveQuote && liveQuote.buyPrice > 0) {
          const perUnitPrice =
            item.unit === 'lượng' ? liveQuote.buyPrice * 10 : liveQuote.buyPrice;
          return {
            ...item,
            currentMarketPrice: perUnitPrice,
            lastUpdated: syncedAt,
          };
        }
        return item;
      });

      if (hasLiveData) {
        return {
          stocks: updatedStocks,
          gold: updatedGold,
          syncedAt,
          source: 'live',
        };
      }
    }
  } catch {
    // Fall back gracefully if backend endpoint is temporarily unreachable
  }

  const fallbackTime = new Date().toISOString();
  return {
    stocks: stocks.map((s) => ({ ...s, lastUpdated: fallbackTime })),
    gold: gold.map((g) => ({ ...g, lastUpdated: fallbackTime })),
    syncedAt: fallbackTime,
    source: 'simulated',
  };
}
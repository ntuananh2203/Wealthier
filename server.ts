import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        longName?: string;
        shortName?: string;
      };
    }>;
  };
}

interface MihongGoldItem {
  buyingPrice?: number;
  sellingPrice?: number;
  code?: string;
  dateTime?: string;
}

async function fetchYahooStockQuote(symbol: string) {
  const clean = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean) return null;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(clean)}.VN?interval=1d&range=2d`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TaiChinh360/1.0)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(4500),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as YahooChartResponse;
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number' || meta.regularMarketPrice <= 0) {
    return null;
  }

  const price = Math.round(meta.regularMarketPrice);
  const prevClose =
    typeof meta.chartPreviousClose === 'number' && meta.chartPreviousClose > 0
      ? Math.round(meta.chartPreviousClose)
      : typeof meta.previousClose === 'number' && meta.previousClose > 0
        ? Math.round(meta.previousClose)
        : price;

  return {
    symbol: clean,
    price,
    prevClose,
    name: meta.longName || meta.shortName || undefined,
    live: true,
  };
}

async function fetchMihongGoldPrices() {
  const url = 'https://api.mihong.vn/v1/gold-prices?market=domestic';
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; TaiChinh360/1.0)',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(4500),
  });

  if (!res.ok) return null;
  const items = (await res.json()) as MihongGoldItem[];
  if (!Array.isArray(items) || items.length === 0) return null;

  const goldMap: Record<
    string,
    { buyPrice: number; sellPrice: number; dateTime: string }
  > = {};

  for (const item of items) {
    if (
      item.code &&
      typeof item.buyingPrice === 'number' &&
      item.buyingPrice > 0
    ) {
      goldMap[item.code.toUpperCase()] = {
        buyPrice: Math.round(item.buyingPrice),
        sellPrice:
          typeof item.sellingPrice === 'number' && item.sellingPrice > 0
            ? Math.round(item.sellingPrice)
            : Math.round(item.buyingPrice),
        dateTime: item.dateTime || '',
      };
    }
  }

  return Object.keys(goldMap).length > 0 ? goldMap : null;
}

async function startServer() {
  const app = express();

  // Live Vietnamese stock & domestic gold market prices proxy
  app.get('/api/market-prices', async (req, res) => {
    const rawSymbols = String(req.query.symbols || '');
    const symbols = Array.from(
      new Set(
        rawSymbols
          .split(',')
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      )
    ).slice(0, 30);

    const [goldResult, ...stockResults] = await Promise.allSettled([
      fetchMihongGoldPrices(),
      ...symbols.map((sym) => fetchYahooStockQuote(sym)),
    ]);

    const stocks: Record<
      string,
      { price: number; prevClose: number; name?: string; live: boolean }
    > = {};
    let liveStocksCount = 0;

    for (const result of stockResults) {
      if (result.status === 'fulfilled' && result.value) {
        stocks[result.value.symbol] = {
          price: result.value.price,
          prevClose: result.value.prevClose,
          name: result.value.name,
          live: true,
        };
        liveStocksCount += 1;
      }
    }

    const gold =
      goldResult.status === 'fulfilled' && goldResult.value
        ? goldResult.value
        : {};

    res.json({
      stocks,
      gold,
      fetchedAt: new Date().toISOString(),
      liveStocksCount,
      liveGoldAvailable: Object.keys(gold).length > 0,
    });
  });

  app.get('/api/stock-quote', async (req, res) => {
    const symbol = String(req.query.symbol || '').trim().toUpperCase();
    if (!symbol) {
      res.status(400).json({ error: 'Missing symbol' });
      return;
    }

    try {
      const quote = await fetchYahooStockQuote(symbol);
      if (!quote) {
        res.status(404).json({ error: 'Quote not found' });
        return;
      }
      res.json(quote);
    } catch {
      res.status(502).json({ error: 'Upstream unavailable' });
    }
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TaiChinh360 server listening on http://localhost:${PORT}`);
  });
}

startServer();

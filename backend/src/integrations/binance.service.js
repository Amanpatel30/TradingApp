const WebSocket = require('ws');
const { updatePrice, setMarketConnectionStatus } = require('../state/market.state');
const { broadcastPrice, broadcastMarketStatus } = require('../websocket/ws.server');
const { checkAndExecuteOrders } = require('../modules/orders/services/matching-engine-service');
const Asset = require('../schema/asset.model');
const {
  persistSpotTicker,
  refreshDerivativeMetrics,
} = require('../modules/market/services/sync-market-tickers-service');

let ws;
let derivativesInterval;
const lastPersistAtBySymbol = {};

const SPOT_PERSIST_INTERVAL_MS = 15000;
const DERIVATIVES_REFRESH_INTERVAL_MS = 60000;
const BINANCE_REST_BASE = 'https://api.binance.com';
const INTERVAL_MAP = {
  '1H': '1h',
  '4H': '4h',
  '1D': '1d',
  '1W': '1w',
};

const toReplayLabel = (openTime, interval) => {
  const date = new Date(openTime);

  if (interval === '1w') {
    const monthLabel = date.toLocaleDateString('en-US', {
      month: 'short',
      timeZone: 'UTC',
    });
    const weekOfMonth = Math.floor((date.getUTCDate() - 1) / 7) + 1;
    return `${monthLabel} W${weekOfMonth}`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
};

const downsampleKlines = (klines, maxPoints = 80) => {
  if (klines.length <= maxPoints) {
    return klines;
  }

  return Array.from({ length: maxPoints }, (_, index) => {
    const sourceIndex = Math.min(
      klines.length - 1,
      Math.round((index / Math.max(1, maxPoints - 1)) * (klines.length - 1))
    );
    return klines[sourceIndex];
  });
};

const fetchKlineChunk = async ({ symbol, interval, startTime, endTime, limit = 1000 }) => {
  const query = new URLSearchParams({
    symbol,
    interval,
    startTime: String(startTime),
    endTime: String(endTime),
    limit: String(limit),
  });

  const response = await fetch(`${BINANCE_REST_BASE}/api/v3/klines?${query.toString()}`);
  if (!response.ok) {
    throw new Error(`Binance klines request failed with status ${response.status}`);
  }

  return response.json();
};

const fetchHistoricalKlines = async ({ symbol, year, timeframe, maxPoints = 80 }) => {
  const interval = INTERVAL_MAP[String(timeframe || '').toUpperCase()];
  if (!interval) {
    throw new Error(`Unsupported replay timeframe "${timeframe}"`);
  }

  const startTime = Date.UTC(Number(year), 0, 1, 0, 0, 0, 0);
  const endTime = Date.UTC(Number(year) + 1, 0, 1, 0, 0, 0, 0) - 1;
  const klines = [];
  let cursor = startTime;

  while (cursor < endTime) {
    const chunk = await fetchKlineChunk({
      symbol: String(symbol || '').toUpperCase(),
      interval,
      startTime: cursor,
      endTime,
      limit: 1000,
    });

    if (!Array.isArray(chunk) || !chunk.length) {
      break;
    }

    klines.push(...chunk);
    const lastOpenTime = Number(chunk[chunk.length - 1][0]);
    if (!Number.isFinite(lastOpenTime) || chunk.length < 1000) {
      break;
    }

    cursor = lastOpenTime + 1;
  }

  return downsampleKlines(klines, maxPoints).map((item) => ({
    open: Number(item[1]),
    high: Number(item[2]),
    low: Number(item[3]),
    close: Number(item[4]),
    time: toReplayLabel(Number(item[0]), interval),
  }));
};

const startBinanceStream = (symbols = []) => {
  if (!symbols.length) {
    console.log('No symbols provided to Binance stream');
    return;
  }

  const streams = symbols
    .map(symbol => `${symbol.toLowerCase()}@ticker`)
    .join('/');

  const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
  ws = new WebSocket(url);

  ws.on('open', () => {
    console.log('✅ Connected to Binance WebSocket');
    setMarketConnectionStatus('CONNECTED');
    broadcastMarketStatus();
  });

 ws.on('message', (data) => {
  const parsed = JSON.parse(data);

  if (!parsed.data) return;

  const ticker = parsed.data;

  const symbol = ticker.s;

  const marketData = {
    symbol,
    price: parseFloat(ticker.c),
    open: parseFloat(ticker.o),
    high: parseFloat(ticker.h),
    low: parseFloat(ticker.l),
    volume: parseFloat(ticker.v),
    changePercent: parseFloat(ticker.P),
    eventTime: Number(ticker.E || Date.now()),
    timestamp: new Date(),
  };

  updatePrice(symbol, marketData);

  broadcastPrice(symbol, marketData);
  broadcastMarketStatus();

  const now = Date.now();
  const lastPersistAt = lastPersistAtBySymbol[symbol] || 0;
  if (now - lastPersistAt >= SPOT_PERSIST_INTERVAL_MS) {
    lastPersistAtBySymbol[symbol] = now;
    Asset.findOne({ symbol })
      .lean()
      .then((asset) => {
        if (!asset) {
          return null;
        }

        return persistSpotTicker(asset, marketData);
      })
      .catch((error) => {
        console.error(`Market ticker persistence error for ${symbol}:`, error.message);
      });
  }
  
  // ── Execute Matching Engine ────────────────────────────────────
  checkAndExecuteOrders(symbol, marketData.price, marketData.eventTime).catch(err => {
    console.error(`Matching Engine Error for ${symbol}:`, err.message);
  });
});


  ws.on('close', () => {
    console.log('❌ Binance disconnected. Reconnecting...');
    setMarketConnectionStatus('DISCONNECTED');
    broadcastMarketStatus();
    setTimeout(() => startBinanceStream(symbols), 5000);
  });

  ws.on('error', (err) => {
    console.error('Binance WS error:', err.message);
    setMarketConnectionStatus('DISCONNECTED');
    broadcastMarketStatus();
  });

  refreshDerivativeMetrics(symbols).catch((error) => {
    console.error('Initial derivatives sync failed:', error.message);
  });

  clearInterval(derivativesInterval);
  derivativesInterval = setInterval(() => {
    refreshDerivativeMetrics(symbols).catch((error) => {
      console.error('Recurring derivatives sync failed:', error.message);
    });
  }, DERIVATIVES_REFRESH_INTERVAL_MS);
};

module.exports = {
  startBinanceStream,
  fetchHistoricalKlines,
};

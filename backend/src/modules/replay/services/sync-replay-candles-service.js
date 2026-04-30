const MarketCandle = require('../../../schema/market-candle.model');
const { fetchHistoricalKlines } = require('../../../integrations/binance.service');

const REAL_SOURCE = 'BINANCE_HISTORICAL';

const ensureReplayCandles = async ({ symbol, year, timeframe }) => {
  const normalized = {
    symbol: String(symbol || 'BTCUSDT').replace('/', '').toUpperCase(),
    year: String(year || '2025'),
    timeframe: String(timeframe || '4H').toUpperCase(),
  };

  let marketDoc = await MarketCandle.findOne(normalized).lean();

  if (marketDoc?.candles?.length && marketDoc.source === REAL_SOURCE) {
    return {
      marketDoc,
      sourceMeta: {
        source: marketDoc.source,
        fallbackUsed: false,
        lastSyncedAt: marketDoc.lastSyncedAt,
      },
    };
  }

  try {
    const candles = await fetchHistoricalKlines({
      symbol: normalized.symbol,
      year: normalized.year,
      timeframe: normalized.timeframe,
      maxPoints: 80,
    });

    if (candles.length) {
      marketDoc = await MarketCandle.findOneAndUpdate(
        normalized,
        {
          $set: {
            ...normalized,
            candles,
            source: REAL_SOURCE,
            fetchedFrom: 'binance/api/v3/klines',
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      return {
        marketDoc,
        sourceMeta: {
          source: REAL_SOURCE,
          fallbackUsed: false,
          lastSyncedAt: marketDoc.lastSyncedAt,
        },
      };
    }
  } catch (error) {
    // Fall back to stored candles below if live history is unavailable.
  }

  marketDoc = marketDoc || (await MarketCandle.findOne(normalized).lean());

  return {
    marketDoc,
    sourceMeta: {
      source: marketDoc?.source || 'UNAVAILABLE',
      fallbackUsed: Boolean(marketDoc?.candles?.length),
      lastSyncedAt: marketDoc?.lastSyncedAt || null,
    },
  };
};

module.exports = {
  ensureReplayCandles,
  REAL_SOURCE,
};

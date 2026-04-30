const ReplaySession = require('../../../schema/replay-session.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { ensureReplayCandles } = require('./sync-replay-candles-service');

const inferReplayMistake = ({ riskPct, visibleCount, pnl }) => {
  if (riskPct > 2.5) {
    return 'Risk Too High';
  }
  if (visibleCount < 20) {
    return 'Early Entry';
  }
  if (pnl < 0 && visibleCount > 55) {
    return 'Stop Moved';
  }
  return '';
};

const placeReplayTrade = async (userId, payload = {}) => {
  const symbol = String(payload.symbol || 'BTCUSDT').replace('/', '').toUpperCase();
  const year = String(payload.year || '2025');
  const timeframe = String(payload.timeframe || '4H');
  const visibleCount = Number(payload.visibleCount || 30);
  const size = Number(payload.size || 0.1);
  const side = String(payload.side || 'Long');
  const entry = Number(payload.entry || 0);
  const sl = Number(payload.sl || 0);
  const tp = Number(payload.tp || 0);

  const replayMarket = await ensureReplayCandles({ symbol, year, timeframe });
  const marketDoc = replayMarket.marketDoc;
  if (!marketDoc) {
    throw new BadRequestError('Replay candles not found');
  }

  const currentCandle = marketDoc.candles[Math.max(0, visibleCount - 1)];
  const futureCandle = marketDoc.candles[Math.min(marketDoc.candles.length - 1, visibleCount + 3)];
  const effectiveEntry = entry || Number(currentCandle?.close || 0);
  const effectiveExit = Number(futureCandle?.close || currentCandle?.close || effectiveEntry);
  const direction = side.toLowerCase().includes('sell') || side.toLowerCase().includes('short') ? -1 : 1;
  const pnl = Number(((effectiveExit - effectiveEntry) * size * direction).toFixed(2));
  const riskPct = Math.abs(effectiveEntry - sl) * size / Math.max(1, 22500) * 100;
  const mistake = inferReplayMistake({ riskPct, visibleCount, pnl });

  const session = await ReplaySession.findOneAndUpdate(
    { user: userId, symbol, year, timeframe },
    {
      $setOnInsert: {
        user: userId,
        symbol,
        year,
        timeframe,
      },
      $set: {
        visibleCount,
      },
      $push: {
        trades: {
          side: side.toLowerCase().includes('sell') ? 'Short' : 'Long',
          size,
          entry: effectiveEntry,
          exit: effectiveExit,
          pnl,
          ok: pnl >= 0,
          mistake,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return session;
};

module.exports = {
  placeReplayTrade,
};

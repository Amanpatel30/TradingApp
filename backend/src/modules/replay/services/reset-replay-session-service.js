const ReplaySession = require('../../../schema/replay-session.model');

const resetReplaySession = async (userId, payload = {}) => {
  const symbol = String(payload.symbol || 'BTCUSDT').replace('/', '').toUpperCase();
  const year = String(payload.year || '2025');
  const timeframe = String(payload.timeframe || '4H');

  const session = await ReplaySession.findOneAndUpdate(
    { user: userId, symbol, year, timeframe },
    {
      $set: {
        trades: [],
        visibleCount: 30,
        speed: 1,
      },
    },
    { new: true }
  ).lean();

  return session;
};

module.exports = {
  resetReplaySession,
};

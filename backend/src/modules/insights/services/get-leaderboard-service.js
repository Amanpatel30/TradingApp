const {
  buildLeaderboardView,
} = require('./trading-insights-service');

const getLeaderboard = async (userId, options = {}) =>
  buildLeaderboardView({
    currentUserId: userId,
    period: options.period,
    mode: options.mode,
  });

module.exports = {
  getLeaderboard,
};

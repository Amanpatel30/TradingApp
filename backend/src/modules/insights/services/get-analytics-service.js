const {
  loadUserInsightsContext,
  buildAnalyticsView,
} = require('./trading-insights-service');

const getAnalytics = async (userId) => {
  const context = await loadUserInsightsContext(userId);
  return buildAnalyticsView(context);
};

module.exports = {
  getAnalytics,
};

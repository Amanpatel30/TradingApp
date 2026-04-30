const {
  loadUserInsightsContext,
  buildJournalRows,
  buildMistakeView,
} = require('./trading-insights-service');

const getMistakes = async (userId) => {
  const context = await loadUserInsightsContext(userId);
  const journalRows = buildJournalRows(
    context.orders,
    context.journalEntries,
    context.latestPriceMap
  );
  return buildMistakeView({
    journalRows,
    orders: context.orders,
  });
};

module.exports = {
  getMistakes,
};

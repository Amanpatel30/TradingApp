const {
  loadUserInsightsContext,
  buildJournalRows,
  buildEmotionPnl,
} = require('../../insights/services/trading-insights-service');

const getJournalOverview = async (userId) => {
  const context = await loadUserInsightsContext(userId);
  const rows = buildJournalRows(
    context.orders,
    context.journalEntries,
    context.latestPriceMap
  );

  return {
    trades: rows,
    emotionPnlData: buildEmotionPnl(rows),
  };
};

module.exports = {
  getJournalOverview,
};

const state = {
  transactionsSupported: false,
  transactionCheckCompleted: false,
  tradingEnabled: false,
  tradingDisabledReason: 'Trading disabled while the database capability check is still running.',
};

const setTransactionSupport = ({ supported, reason = '' }) => {
  state.transactionCheckCompleted = true;
  state.transactionsSupported = Boolean(supported);
  state.tradingEnabled = Boolean(supported);
  state.tradingDisabledReason = supported
    ? ''
    : reason || 'Trading disabled — database not fully supported';
};

const getTradingSystemStatus = () => ({
  transactionsSupported: state.transactionsSupported,
  transactionCheckCompleted: state.transactionCheckCompleted,
  tradingEnabled: state.tradingEnabled,
  tradingDisabledReason: state.tradingDisabledReason,
});

module.exports = {
  setTransactionSupport,
  getTradingSystemStatus,
};

const mongoose = require('mongoose');
const { CustomError } = require('../../../utils/custom-error');
const { setTransactionSupport, getTradingSystemStatus } = require('../../../state/trading-system.state');

const isTransactionCapableHello = (hello) =>
  Boolean(hello?.setName || hello?.msg === 'isdbgrid');

const initializeTransactionSupport = async () => {
  const connection = mongoose.connection;
  if (!connection?.db) {
    await new Promise((resolve, reject) => {
      const handleConnected = () => {
        connection.off('error', handleError);
        resolve();
      };
      const handleError = (error) => {
        connection.off('connected', handleConnected);
        reject(error);
      };

      connection.once('connected', handleConnected);
      connection.once('error', handleError);
    });
  }

  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  const supported = isTransactionCapableHello(hello);

  setTransactionSupport({
    supported,
    reason: supported ? '' : 'Trading disabled — database not fully supported for Mongo transactions.',
  });

  return supported;
};

const assertTradingTransactionsEnabled = () => {
  const status = getTradingSystemStatus();
  if (!status.transactionsSupported || !status.tradingEnabled) {
    throw new CustomError(
      status.tradingDisabledReason || 'Trading disabled — database not fully supported',
      503
    );
  }
};

const runWithMongoTransaction = async (work) => {
  assertTradingTransactionsEnabled();
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work({ session, transactional: true });
    });
    return result;
  } finally {
    await session.endSession().catch(() => {});
  }
};

module.exports = {
  initializeTransactionSupport,
  assertTradingTransactionsEnabled,
  runWithMongoTransaction,
};

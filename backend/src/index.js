const http = require('http');
const app = require('./app');
const config = require('./config/config');
const connectDB = require('./mongoose');
const Logger = require('./utils/logger');
const { startBinanceStream } = require('./integrations/binance.service');
const { initWebSocketServer } = require('./websocket/ws.server');
const { getActiveSymbols } = require('./modules/asset/services/get-active-symbols-service');
const { seedDemoData } = require('./bootstrap/seed-demo-data');
const {
  reconcileTradingState,
  startProcessingRecoveryLoop,
} = require('./modules/orders/services/reconcile-trading-state-service');
const {
  initializeTransactionSupport,
} = require('./modules/orders/services/mongo-transaction-service');
const { getTradingSystemStatus } = require('./state/trading-system.state');
const {
  handleUnhandledRejection,
  handleUncaughtException,
} = require('./middlewares/error-handler');

const logger = new Logger('Server');
const server = http.createServer(app);

handleUncaughtException();
handleUnhandledRejection();

const startRuntimeServices = async () => {
  const transactionsSupported = await initializeTransactionSupport();
  const tradingStatus = getTradingSystemStatus();

  if (transactionsSupported) {
    logger.info('Mongo transaction support detected. Trading is enabled.');
  } else {
    logger.warn(tradingStatus.tradingDisabledReason);
  }

  await reconcileTradingState();
  startProcessingRecoveryLoop({ intervalMs: 10000, olderThanMs: 5000 });
  await seedDemoData();

  const symbols = await getActiveSymbols();

  if (!symbols.length) {
    logger.warn('No active assets found in DB');
    return;
  }

  logger.info(`Starting Binance stream for: ${symbols.join(', ')}`);
  startBinanceStream(symbols);
};

const startServer = async () => {
  await connectDB();
  initWebSocketServer(server);

  server.listen(config.port, async () => {
    logger.info(`Server is running on port ${config.port} in ${config.nodeEnv} mode`);
    logger.info(`http://localhost:${config.port}`);

    try {
      await startRuntimeServices();
    } catch (error) {
      logger.error('Failed to start runtime services:', { error: error.message });
    }
  });
};

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  server,
  startRuntimeServices,
  startServer,
};

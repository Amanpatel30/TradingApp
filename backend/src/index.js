const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { version, name } = require('../package.json');
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
const config = require('./config/config');
const connectDB = require('./mongoose');
const routes = require('./routes');
const http = require('http');
const app = express();
const server = http.createServer(app);
// const server = http.createServer(app);
const { 
  errorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException 
} = require('./middlewares/error-handler');
const Logger = require('./utils/logger');
const { NotFoundError } = require('./utils/custom-error');


// need more stimulation under my code

connectDB();

initWebSocketServer(server);



const logger = new Logger('Server');
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
const hasFrontendBuild = fs.existsSync(frontendDistPath);

// Handle uncaught exceptions
handleUncaughtException();

// Handle unhandled promise rejections
handleUnhandledRejection();

// Initialize express app


// Connect to database


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/version', (req, res) => {
  res.json({
    name,
    version,    
    message: 'Welcome to the REST API',
  });
});

app.use('/api', routes);

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// 404 handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.originalUrl} not found`));
});

// Error handling middleware
app.use(errorHandler);

// Start server
server.listen(config.port, async () => {
  logger.info(`Server is running on port ${config.port} in ${config.nodeEnv} mode`);
  logger.info(`http://localhost:${config.port}`);

  // Start Binance stream AFTER server starts
  try {
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

    // 🔥 Fetch symbols dynamically from DB
    const symbols = await getActiveSymbols();

    if (!symbols.length) {
      logger.warn('No active assets found in DB');
      return;
    }

    logger.info(`Starting Binance stream for: ${symbols.join(', ')}`);

    startBinanceStream(symbols);

  } catch (error) {
    logger.error('Failed to start Binance stream:', error.message);
  }
});
module.exports = app;

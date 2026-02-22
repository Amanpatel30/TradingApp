const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { version, name } = require('../package.json');
const { startBinanceStream } = require('./integrations/binance.service');
const { initWebSocketServer } = require('./websocket/ws.server');
const { getActiveSymbols } = require('./modules/asset/services/get-active-symbols-service');
const config = require('./config/config');
const connectDB = require('./mongoose');
const routes = require('./routes');
const http = require('http');
const app = express();
const server = http.createServer(app);
const { 
  errorHandler, 
  handleUnhandledRejection, 
  handleUncaughtException 
} = require('./middlewares/error-handler');
const Logger = require('./utils/logger');
const { NotFoundError } = require('./utils/custom-error');




connectDB();

initWebSocketServer(server);



const logger = new Logger('Server');

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

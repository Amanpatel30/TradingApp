const express = require('express');
const { getTickersController } = require('./controllers/get-tickers-controller');
const {
  getMarketOverviewController,
} = require('./controllers/get-market-overview-controller');

const router = express.Router();

router.get('/tickers', getTickersController);
router.get('/overview', getMarketOverviewController);

module.exports = router;

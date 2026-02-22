const express = require('express');
const authenticate = require('../../../middlewares/authenticate');
const validateRequest = require('../../../middlewares/validate-request');
const {
  getTradeHistoryController,
} = require('../controllers/get-trade-history-controller');
const {
  TradeHistoryQuerySchema,
} = require('../validations/trade-history.schema');

const router = express.Router();

router.get(
  '/history',
  authenticate,
  validateRequest(TradeHistoryQuerySchema, { source: 'query', errorStatus: 400 }),
  getTradeHistoryController
);

module.exports = router;

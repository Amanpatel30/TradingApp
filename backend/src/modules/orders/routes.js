const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/authenticate');
const { createMarketOrder } = require('./controllers/create-market-order-controller');

const { createLimitOrder } = require('./controllers/create-limit-order-controller');
const { cancelOrderController } = require('./controllers/cancel-order-controller');

router.post('/market', authenticate, createMarketOrder);
router.post('/limit', authenticate, createLimitOrder);
router.patch('/:id/cancel', authenticate, cancelOrderController);

module.exports = router;

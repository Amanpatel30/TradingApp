const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes');
const assetRoutes = require('../modules/asset/routes');
const orderRoutes = require('../modules/orders/routes');
const portfolioRoutes = require('../modules/portfolio/routes');
const tradeRoutes = require('../modules/trades/routes/trade.routes');

// Mount module routes
router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/trades', tradeRoutes);

module.exports = router;

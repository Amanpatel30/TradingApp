const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes');
const assetRoutes = require('../modules/asset/routes');
const marketRoutes = require('../modules/market/routes');
const orderRoutes = require('../modules/orders/routes');
const portfolioRoutes = require('../modules/portfolio/routes');
const tradeRoutes = require('../modules/trades/routes/trade.routes');
const dashboardRoutes = require('../modules/dashboard/routes');
const insightsRoutes = require('../modules/insights/routes');
const journalRoutes = require('../modules/journal/routes');
const strategyRoutes = require('../modules/strategies/routes');
const learningRoutes = require('../modules/learning/routes');
const replayRoutes = require('../modules/replay/routes');

// Mount module routes
router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/market', marketRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/trades', tradeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/insights', insightsRoutes);
router.use('/journal', journalRoutes);
router.use('/strategies', strategyRoutes);
router.use('/learning', learningRoutes);
router.use('/replay', replayRoutes);

module.exports = router;

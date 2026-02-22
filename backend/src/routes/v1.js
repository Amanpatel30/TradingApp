const express = require('express');
const router = express.Router();

const authRoutes = require('../modules/auth/routes');
const assetRoutes = require('../modules/asset/routes');
const orderRoutes = require('../modules/orders/routes');
const portfolioRoutes = require('../modules/portfolio/routes');

// Mount module routes
router.use('/auth', authRoutes);
router.use('/assets', assetRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);

module.exports = router;

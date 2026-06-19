const express = require('express');
const router = express.Router();

const v1Routes = require('./v1');
const tradeRoutes = require('../modules/trades/routes/trade.routes');

// API version routes
router.use('/v1', v1Routes);

// Compatibility mount
router.use('/trades', tradeRoutes);

module.exports = router;

const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const {
  getDashboardSummaryController,
} = require('./controllers/get-dashboard-summary-controller');

const router = express.Router();

router.get('/summary', authenticate, getDashboardSummaryController);

module.exports = router;

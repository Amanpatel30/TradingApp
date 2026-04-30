const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const {
  getAnalyticsController,
} = require('./controllers/get-analytics-controller');
const {
  getMistakesController,
} = require('./controllers/get-mistakes-controller');
const {
  getLeaderboardController,
} = require('./controllers/get-leaderboard-controller');

const router = express.Router();

router.get('/analytics', authenticate, getAnalyticsController);
router.get('/mistakes', authenticate, getMistakesController);
router.get('/leaderboard', authenticate, getLeaderboardController);

module.exports = router;

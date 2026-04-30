const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const {
  getReplaySessionController,
} = require('./controllers/get-replay-session-controller');
const {
  placeReplayTradeController,
} = require('./controllers/place-replay-trade-controller');
const {
  resetReplaySessionController,
} = require('./controllers/reset-replay-session-controller');

const router = express.Router();

router.get('/session', authenticate, getReplaySessionController);
router.post('/trade', authenticate, placeReplayTradeController);
router.post('/reset', authenticate, resetReplaySessionController);

module.exports = router;

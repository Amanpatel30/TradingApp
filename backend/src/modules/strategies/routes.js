const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const {
  getStrategiesController,
} = require('./controllers/get-strategies-controller');
const {
  createStrategyController,
  updateStrategyController,
} = require('./controllers/save-strategy-controller');
const {
  deleteStrategyController,
} = require('./controllers/delete-strategy-controller');
const {
  backtestStrategyController,
} = require('./controllers/backtest-strategy-controller');

const router = express.Router();

router.get('/', authenticate, getStrategiesController);
router.post('/', authenticate, createStrategyController);
router.patch('/:id', authenticate, updateStrategyController);
router.delete('/:id', authenticate, deleteStrategyController);
router.post('/backtest', authenticate, backtestStrategyController);

module.exports = router;

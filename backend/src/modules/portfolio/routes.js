const express = require('express');
const router = express.Router();
const authenticate = require('../../middlewares/authenticate');
const { getPortfolioController } = require('./controllers/get-portfolio-controller');

router.get('/', authenticate, getPortfolioController);

module.exports = router;

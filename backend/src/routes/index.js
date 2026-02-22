const express = require('express');
const router = express.Router();

const v1Routes = require('./v1');

// API version routes
router.use('/v1', v1Routes);

module.exports = router;

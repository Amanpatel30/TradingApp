const express = require('express');
const router = express.Router();

const { register } = require('./controllers/register');
const { login } = require('./controllers/login');
const { refreshToken } = require('./controllers/refresh-token');
const { logout } = require('./controllers/logout');
const { getMe } = require('./controllers/get-me');
const authenticate = require('../../middlewares/authenticate');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

module.exports = router;

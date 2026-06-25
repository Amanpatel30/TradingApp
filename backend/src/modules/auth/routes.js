const express = require('express');
const router = express.Router();

const { register } = require('./controllers/register');
const { login } = require('./controllers/login');
const { refreshToken } = require('./controllers/refresh-token');
const { logout } = require('./controllers/logout');
const { getMe } = require('./controllers/get-me');
const { updateProfileController } = require('./controllers/update-profile');
const { addDemoBalanceController } = require('./controllers/add-demo-balance');
const authenticate = require('../../middlewares/authenticate');
const validateRequest = require('../../middlewares/validate-request');
const { registerSchema, loginSchema, refreshTokenSchema } = require('./validations/auth.schema');

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh-token', validateRequest(refreshTokenSchema), refreshToken);

// Protected routes
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfileController);
router.post('/demo-balance', authenticate, addDemoBalanceController);

module.exports = router;

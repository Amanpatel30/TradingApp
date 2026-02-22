const express = require('express');
const router = express.Router();

const { getAllAssets } = require('./controllers/get-all-Assets.js');
const { getAssetById } = require('./controllers/get-asset-by-id.js');
const { createAsset } = require('./controllers/create-asset.js');
const { updateAsset } = require('./controllers/update-asset');
const { deleteAsset } = require('./controllers/delete-asset.js');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const createAssetSchema = require('./validations/create-asset');  
const validateRequest = require('../../middlewares/validate-request');
const updateAssetSchema = require('./validations/update-asset');

// Public routes
router.get('/', getAllAssets);
router.get('/:id', getAssetById);

// Protected routes
router.post('/', authenticate,authorize('admin'),validateRequest(createAssetSchema), createAsset);
router.put('/:id', authenticate,authorize('admin'),validateRequest(updateAssetSchema), updateAsset);
router.delete('/:id', authenticate,authorize('admin'), deleteAsset);

module.exports = router;

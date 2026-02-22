const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getAllActiveAssets } = require('../services/get-all-asset-services.js');
const assetLogger = require('../asset-logger');

// @desc    Get all active assets
// @route   GET /api/v1/assets
// @access  Public
const getAllAssets = asyncHandler(async (req, res) => {
  assetLogger.debug('GET /assets called');

  const assets = await getAllActiveAssets();

  assetLogger.info(`Returning ${assets.length} active assets`);

  return ApiResponse.success(
    res,
    assets,
    'Active assets retrieved successfully'
  );
});

module.exports = { getAllAssets };

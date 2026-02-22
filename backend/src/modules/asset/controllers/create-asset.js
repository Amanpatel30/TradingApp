const { assetService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');


// @desc    Create new asset
// @route   POST /api/v1/assets
// @access  Private
const createAsset = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const asset = await assetService.createAsset(req.body, userId);

  return ApiResponse.created(res, asset, 'Asset created successfully');
});

module.exports = { createAsset };

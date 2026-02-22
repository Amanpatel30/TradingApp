const { assetService} = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { NotFoundError } = require('../../../utils/custom-error');

// @desc    Get single asset
// @route   GET /api/v1/assets/:id
// @access  Public
const getAssetById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  return ApiResponse.success(res, asset, 'Asset retrieved successfully');
});

module.exports = { getAssetById };

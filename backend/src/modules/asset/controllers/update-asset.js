const { assetService } = require('../services');
const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { NotFoundError } = require('../../../utils/custom-error');

// @desc    Update Asset
// @route   PUT /api/v1/assets/:id
// @access  Private
const updateAsset = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAsset(req.params.id, req.body);

  if (!asset) {
    throw new NotFoundError('Asset not found');
  }

  return ApiResponse.success(res, asset, 'Asset updated successfully');
});

module.exports = { updateAsset };

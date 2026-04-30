const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { updateProfile } = require('../services/update-profile-service');

const updateProfileController = asyncHandler(async (req, res) => {
  const user = await updateProfile(req.user._id, req.body || {});

  return ApiResponse.success(res, { user }, 'Profile updated successfully');
});

module.exports = {
  updateProfileController,
};

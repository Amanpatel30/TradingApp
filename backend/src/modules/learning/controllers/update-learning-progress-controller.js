const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { updateLearningProgress } = require('../services/update-learning-progress-service');

const updateLearningProgressController = asyncHandler(async (req, res) => {
  const data = await updateLearningProgress(
    req.user._id,
    req.params.lessonId,
    req.body || {}
  );
  return ApiResponse.success(res, data, 'Learning progress updated successfully');
});

module.exports = {
  updateLearningProgressController,
};

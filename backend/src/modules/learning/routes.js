const express = require('express');
const authenticate = require('../../middlewares/authenticate');
const {
  getLearningOverviewController,
} = require('./controllers/get-learning-overview-controller');
const {
  updateLearningProgressController,
} = require('./controllers/update-learning-progress-controller');

const router = express.Router();

router.get('/overview', authenticate, getLearningOverviewController);
router.patch('/lessons/:lessonId/progress', authenticate, updateLearningProgressController);

module.exports = router;

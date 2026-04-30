const LearningLesson = require('../../../schema/learning-lesson.model');
const LearningProgress = require('../../../schema/learning-progress.model');
const { BadRequestError } = require('../../../utils/custom-error');

const updateLearningProgress = async (userId, lessonId, payload = {}) => {
  const numericLessonId = Number(lessonId);
  const lesson = await LearningLesson.findOne({ lessonId: numericLessonId }).lean();
  if (!lesson) {
    throw new BadRequestError('Lesson not found');
  }

  const status = payload.status || 'COMPLETED';
  const score = typeof payload.score === 'number' ? payload.score : 0;

  const progress = await LearningProgress.findOneAndUpdate(
    { user: userId, lessonId: numericLessonId },
    {
      $set: {
        status,
        score,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return progress;
};

module.exports = {
  updateLearningProgress,
};

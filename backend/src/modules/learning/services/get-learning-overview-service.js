const LearningLesson = require('../../../schema/learning-lesson.model');
const LearningPath = require('../../../schema/learning-path.model');
const LearningProgress = require('../../../schema/learning-progress.model');

const getLearningOverview = async (userId) => {
  const [lessons, paths, progress] = await Promise.all([
    LearningLesson.find({}).sort({ lessonId: 1 }).lean(),
    LearningPath.find({}).sort({ createdAt: 1 }).lean(),
    LearningProgress.find({ user: userId }).lean(),
  ]);

  const progressByLessonId = new Map(
    progress.map((entry) => [entry.lessonId, entry])
  );

  const mappedLessons = lessons.map((lesson) => {
    const progressEntry = progressByLessonId.get(lesson.lessonId);
    return {
      id: lesson.lessonId,
      category: lesson.category,
      title: lesson.title,
      desc: lesson.desc,
      duration: lesson.duration,
      level: lesson.level,
      completed: progressEntry?.status === 'COMPLETED',
      rating: lesson.rating,
      iconKey: lesson.iconKey,
      color: lesson.color,
      locked: Boolean(lesson.locked),
      quizQuestions: lesson.quizQuestions || [],
      score: progressEntry?.score || 0,
    };
  });

  const completedLessonIds = mappedLessons
    .filter((lesson) => lesson.completed)
    .map((lesson) => lesson.id);

  const mappedPaths = paths.map((path) => ({
    id: path.pathId,
    title: path.title,
    subtitle: path.subtitle,
    color: path.color,
    bg: path.bg,
    border: path.border,
    iconKey: path.iconKey,
    lessonIds: path.lessonIds || [],
    level: path.level,
    duration: path.duration,
    completedIds: completedLessonIds.filter((lessonId) =>
      (path.lessonIds || []).includes(lessonId)
    ),
  }));

  return {
    lessons: mappedLessons,
    paths: mappedPaths,
    completedLessonIds,
  };
};

module.exports = {
  getLearningOverview,
};

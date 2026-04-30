const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    options: { type: [String], default: [] },
    correctIndex: { type: Number, default: 0 },
  },
  { _id: false }
);

const learningLessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      required: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    desc: {
      type: String,
      trim: true,
      required: true,
    },
    duration: {
      type: String,
      trim: true,
      required: true,
    },
    level: {
      type: String,
      trim: true,
      required: true,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    iconKey: {
      type: String,
      trim: true,
      required: true,
    },
    color: {
      type: String,
      trim: true,
      required: true,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    quizQuestions: {
      type: [quizQuestionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningLesson', learningLessonSchema);

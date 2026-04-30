const mongoose = require('mongoose');

const learningPathSchema = new mongoose.Schema(
  {
    pathId: {
      type: String,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
    },
    subtitle: {
      type: String,
      trim: true,
      required: true,
    },
    color: {
      type: String,
      trim: true,
      required: true,
    },
    bg: {
      type: String,
      trim: true,
      required: true,
    },
    border: {
      type: String,
      trim: true,
      required: true,
    },
    iconKey: {
      type: String,
      trim: true,
      required: true,
    },
    level: {
      type: String,
      trim: true,
      required: true,
    },
    duration: {
      type: String,
      trim: true,
      required: true,
    },
    lessonIds: {
      type: [Number],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LearningPath', learningPathSchema);

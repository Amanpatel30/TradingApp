const User = require('../../../schema/user.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { buildAuthUserPayload } = require('./build-auth-user-payload');

const AVATAR_COLORS = [
  '#4F46E5',
  '#2563EB',
  '#059669',
  '#D97706',
  '#DC2626',
  '#7C3AED',
  '#0F766E',
  '#EA580C',
];

const sanitizeAvatarLabel = (value, fallback = '') => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const compact = value.replace(/[^a-z0-9]/gi, '').slice(0, 2).toUpperCase();
  return compact || fallback;
};

const sanitizeName = (value, fallback) => {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
};

const updateProfile = async (userId, payload = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new BadRequestError('User not found');
  }

  if (payload.name !== undefined) {
    user.name = sanitizeName(payload.name, user.name);
  }

  if (payload.avatarLabel !== undefined) {
    const fallback = sanitizeAvatarLabel(user.name || user.email || 'U', 'U');
    user.avatarLabel = sanitizeAvatarLabel(payload.avatarLabel, fallback);
  }

  if (payload.avatarColor !== undefined) {
    if (!AVATAR_COLORS.includes(payload.avatarColor)) {
      throw new BadRequestError('Unsupported avatar color');
    }
    user.avatarColor = payload.avatarColor;
  }

  if (payload.demoDataFallbackEnabled !== undefined) {
    user.demoDataFallbackEnabled = Boolean(payload.demoDataFallbackEnabled);
  }

  await user.save();

  return buildAuthUserPayload(user);
};

module.exports = {
  AVATAR_COLORS,
  updateProfile,
};

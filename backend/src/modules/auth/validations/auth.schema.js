const { z } = require('zod');
const { AVATAR_COLORS } = require('../services/update-profile-service');

const registerSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().trim().email().toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
});

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(50).optional(),
    avatarLabel: z.string().max(8).optional(),
    avatarColor: z.enum(AVATAR_COLORS).optional(),
    demoDataFallbackEnabled: z.boolean().optional(),
  })
  .strict()
  .refine((payload) => Object.keys(payload).length > 0, {
    message: 'At least one profile field is required',
  });

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
};

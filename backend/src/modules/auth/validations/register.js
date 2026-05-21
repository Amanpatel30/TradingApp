const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Invalid email format').lowercase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).strict(); // strict() ensures no extra fields like 'role' are allowed

module.exports = registerSchema;

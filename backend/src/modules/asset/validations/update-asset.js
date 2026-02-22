const { z } = require("zod");

module.exports = z.object({
  isActive: z.boolean().optional(),
});

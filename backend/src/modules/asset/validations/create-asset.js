const { z } = require("zod");

module.exports = z.object({
  symbol: z.string().min(3).max(20),
  baseAsset: z.string().min(1),
  quoteAsset: z.string().min(1),
  type: z.enum(["CRYPTO", "STOCK"]).optional(),
});

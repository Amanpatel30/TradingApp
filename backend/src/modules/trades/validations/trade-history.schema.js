const { z } = require('zod');

const SUPPORTED_SYMBOL_REGEX = /^[A-Z]{2,10}(USDT|USDC|BUSD|BTC|ETH|BNB)$/;

const TradeHistoryQuerySchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'page must be a number',
      required_error: 'page is required',
    })
    .int('page must be an integer')
    .min(1, 'page must be at least 1'),

  limit: z.coerce
    .number({
      invalid_type_error: 'limit must be a number',
    })
    .int('limit must be an integer')
    .min(1, 'limit must be at least 1')
    .max(100, 'limit must be at most 100')
    .default(20),

  symbol: z
    .string()
    .trim()
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => SUPPORTED_SYMBOL_REGEX.test(value),
      'symbol must be a valid trading pair like BTCUSDT'
    )
    .optional(),
});

module.exports = {
  TradeHistoryQuerySchema,
};

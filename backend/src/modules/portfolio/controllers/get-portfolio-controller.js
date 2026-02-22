const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { getPortfolio } = require('../services/get-portfolio-service');

// @desc    Get user portfolio with unrealized PnL
// @route   GET /api/v1/portfolio
// @access  Private
const getPortfolioController = asyncHandler(async (req, res) => {
  const portfolio = await getPortfolio(req.user._id);

  return ApiResponse.success(res, portfolio, 'Portfolio retrieved successfully');
});

module.exports = { getPortfolioController };

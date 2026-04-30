const asyncHandler = require('../../../utils/async-handler');
const ApiResponse = require('../../../utils/response');
const { BadRequestError } = require('../../../utils/custom-error');
const { addDemoBalance } = require('../services/add-demo-balance-service');

const addDemoBalanceController = asyncHandler(async (req, res) => {
  const { amount } = req.body || {};

  if (amount === undefined) {
    throw new BadRequestError('Please provide an amount to add');
  }

  const data = await addDemoBalance(req.user._id, amount);
  return ApiResponse.success(res, data, 'Demo balance updated successfully');
});

module.exports = {
  addDemoBalanceController,
};

const Strategy = require('../../../schema/strategy.model');
const { BadRequestError } = require('../../../utils/custom-error');

const deleteStrategy = async (userId, strategyId) => {
  const deleted = await Strategy.findOneAndDelete({
    _id: strategyId,
    user: userId,
  }).lean();

  if (!deleted) {
    throw new BadRequestError('Strategy not found');
  }

  return deleted;
};

module.exports = {
  deleteStrategy,
};

const Strategy = require('../../../schema/strategy.model');

const getStrategies = async (userId) => {
  const strategies = await Strategy.find({ user: userId })
    .sort({ updatedAt: -1 })
    .lean();

  return {
    strategies: strategies.map((strategy) => ({
      id: String(strategy._id),
      name: strategy.name,
      conditions: strategy.conditions || [],
      actions: strategy.actions || [],
      latestBacktest: strategy.latestBacktest || null,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
    })),
  };
};

module.exports = {
  getStrategies,
};

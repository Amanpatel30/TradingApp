const Strategy = require('../../../schema/strategy.model');
const { BadRequestError } = require('../../../utils/custom-error');

const normalizeConditions = (conditions = []) =>
  conditions.map((condition, index) => ({
    connector: String(condition.connector || (index === 0 ? 'IF' : 'AND')).trim(),
    indicator: String(condition.indicator || 'RSI').trim(),
    operator: String(condition.operator || '<').trim(),
    value: String(condition.value || '50').trim(),
    timeframe: String(condition.timeframe || '4H').trim(),
  }));

const normalizeActions = (actions = []) =>
  actions.map((action) => ({
    action: String(action.action || 'Buy Market').trim(),
    size: String(action.size || '2%').trim(),
    sl: String(action.sl || '5%').trim(),
    tp: String(action.tp || '10%').trim(),
  }));

const saveStrategy = async (userId, payload = {}, strategyId = null) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw new BadRequestError('Strategy name is required');
  }

  const data = {
    user: userId,
    name,
    conditions: normalizeConditions(payload.conditions),
    actions: normalizeActions(payload.actions),
  };

  if (strategyId) {
    const strategy = await Strategy.findOneAndUpdate(
      { _id: strategyId, user: userId },
      { $set: data },
      { new: true }
    ).lean();

    if (!strategy) {
      throw new BadRequestError('Strategy not found');
    }

    return strategy;
  }

  const strategy = await Strategy.create(data);
  return strategy.toObject();
};

module.exports = {
  saveStrategy,
};

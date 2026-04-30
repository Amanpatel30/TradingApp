const User = require('../../../schema/user.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { buildAuthUserPayload } = require('./build-auth-user-payload');
const {
  rebuildUserPortfolioSnapshots,
} = require('../../dashboard/services/snapshot-service');

const addDemoBalance = async (userId, amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new BadRequestError('Amount must be a positive number');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new BadRequestError('User not found');
  }

  if (!user.wallet || !(user.wallet instanceof Map)) {
    user.wallet = new Map([['USDT', 10000]]);
  }

  const currentUsdt = Number(user.wallet.get('USDT') || 0);
  user.wallet.set('USDT', Number((currentUsdt + numericAmount).toFixed(2)));
  user.demoBalanceTopUpTotal = Number(user.demoBalanceTopUpTotal || 0) + numericAmount;
  user.markModified('wallet');
  await user.save();
  await rebuildUserPortfolioSnapshots(user._id);

  return {
    user: buildAuthUserPayload(user),
    amountAdded: numericAmount,
    newUsdtBalance: Number(user.wallet.get('USDT') || 0),
  };
};

module.exports = {
  addDemoBalance,
};

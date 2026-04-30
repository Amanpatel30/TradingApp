const User = require('../../../schema/user.model');
const { BadRequestError } = require('../../../utils/custom-error');
const { round } = require('./trading-engine-utils');

const getSessionOptions = (session) => (session ? { session, new: true } : { new: true });

const buildPath = (root, asset) => `${root}.${String(asset || 'USDT').toUpperCase()}`;

const reserveWalletBalanceAtomic = async ({ userId, asset = 'USDT', amount, session = null }) => {
  const normalizedAmount = round(amount, 8);
  if (normalizedAmount <= 0) {
    return User.findById(userId, null, session ? { session } : {});
  }

  const availablePath = buildPath('wallet', asset);
  const reservedPath = buildPath('reservedWallet', asset);

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      [availablePath]: { $gte: normalizedAmount },
    },
    {
      $inc: {
        [availablePath]: -normalizedAmount,
        [reservedPath]: normalizedAmount,
      },
    },
    getSessionOptions(session)
  );

  if (!user) {
    throw new BadRequestError(
      `Insufficient ${String(asset || 'USDT').toUpperCase()} balance for reservation`
    );
  }

  return user;
};

const releaseReservedWalletBalanceAtomic = async ({
  userId,
  asset = 'USDT',
  amount,
  session = null,
}) => {
  const normalizedAmount = round(amount, 8);
  if (normalizedAmount <= 0) {
    return User.findById(userId, null, session ? { session } : {});
  }

  const availablePath = buildPath('wallet', asset);
  const reservedPath = buildPath('reservedWallet', asset);

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      [reservedPath]: { $gte: normalizedAmount },
    },
    {
      $inc: {
        [availablePath]: normalizedAmount,
        [reservedPath]: -normalizedAmount,
      },
    },
    getSessionOptions(session)
  );

  if (!user) {
    throw new BadRequestError(
      `Unable to release reserved ${String(asset || 'USDT').toUpperCase()} balance`
    );
  }

  return user;
};

const adjustReservedWalletBalanceAtomic = async ({
  userId,
  asset = 'USDT',
  currentReserved,
  targetReserved,
  session = null,
}) => {
  const normalizedCurrent = round(currentReserved, 8);
  const normalizedTarget = round(targetReserved, 8);
  const delta = round(normalizedTarget - normalizedCurrent, 8);

  if (delta > 0) {
    return reserveWalletBalanceAtomic({
      userId,
      asset,
      amount: delta,
      session,
    });
  }

  if (delta < 0) {
    return releaseReservedWalletBalanceAtomic({
      userId,
      asset,
      amount: Math.abs(delta),
      session,
    });
  }

  return User.findById(userId, null, session ? { session } : {});
};

const applyPositionSettlementAtomic = async ({
  userId,
  asset = 'USDT',
  reservedAmount,
  realizedPnL,
  session = null,
}) => {
  const normalizedReserved = round(reservedAmount, 8);
  const normalizedPnl = round(realizedPnL, 8);
  const availablePath = buildPath('wallet', asset);
  const reservedPath = buildPath('reservedWallet', asset);

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      [reservedPath]: { $gte: normalizedReserved },
    },
    {
      $inc: {
        [reservedPath]: -normalizedReserved,
        [availablePath]: round(normalizedReserved + normalizedPnl, 8),
      },
    },
    getSessionOptions(session)
  );

  if (!user) {
    throw new BadRequestError('Unable to settle reserved balance for closed position');
  }

  return user;
};

const rollbackPositionSettlementAtomic = async ({
  userId,
  asset = 'USDT',
  reservedAmount,
  realizedPnL,
  session = null,
}) => {
  const normalizedReserved = round(reservedAmount, 8);
  const normalizedPnl = round(realizedPnL, 8);
  const settlementCredit = round(normalizedReserved + normalizedPnl, 8);
  const availablePath = buildPath('wallet', asset);
  const reservedPath = buildPath('reservedWallet', asset);

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      [availablePath]: { $gte: settlementCredit },
    },
    {
      $inc: {
        [reservedPath]: normalizedReserved,
        [availablePath]: -settlementCredit,
      },
    },
    getSessionOptions(session)
  );

  if (!user) {
    throw new BadRequestError('Unable to roll back settled balance for position close');
  }

  return user;
};

module.exports = {
  reserveWalletBalanceAtomic,
  releaseReservedWalletBalanceAtomic,
  adjustReservedWalletBalanceAtomic,
  applyPositionSettlementAtomic,
  rollbackPositionSettlementAtomic,
};

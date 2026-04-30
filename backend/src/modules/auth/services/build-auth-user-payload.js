const deriveAvatarLabel = (user) => {
  const explicit = String(user.avatarLabel || '')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 2)
    .toUpperCase();

  if (explicit) {
    return explicit;
  }

  const nameParts = String(user.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  if (nameParts) {
    return nameParts;
  }

  return String(user.email || 'U').slice(0, 1).toUpperCase();
};

const buildAuthUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  avatarLabel: deriveAvatarLabel(user),
  avatarColor: user.avatarColor || '#4F46E5',
  demoDataFallbackEnabled: Boolean(user.demoDataFallbackEnabled),
  wallet:
    user.wallet instanceof Map ? Object.fromEntries(user.wallet) : user.wallet || {},
  reservedWallet:
    user.reservedWallet instanceof Map
      ? Object.fromEntries(user.reservedWallet)
      : user.reservedWallet || {},
  demoBalanceTopUpTotal: Number(user.demoBalanceTopUpTotal || 0),
});

module.exports = {
  buildAuthUserPayload,
};

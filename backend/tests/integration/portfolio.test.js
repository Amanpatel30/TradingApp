const { api } = require('../helpers/api');
const { authHeadersFor, createOrder, createPosition, createUser, seedMarketPrice } = require('../helpers/factories');

describe('portfolio integration', () => {
  it('returns an empty portfolio for a new user with USDT balance only', async () => {
    const { user } = await createUser({ wallet: { USDT: 10000 }, reservedWallet: { USDT: 0 } });

    const response = await api()
      .get('/api/v1/portfolio')
      .set(authHeadersFor(user))
      .expect(200);

    expect(response.body.data.assets).toEqual([]);
    expect(response.body.data.openPositions).toEqual([]);
    expect(response.body.data.availableUsdt).toBe(10000);
    expect(response.body.data.totalPortfolioValue).toBe(10000);
  });

  it('returns existing holdings and open positions', async () => {
    seedMarketPrice('BTCUSDT', { price: 55000 });
    const { user } = await createUser({ wallet: { USDT: 2000, BTC: 0.1 }, reservedWallet: { USDT: 100 } });
    await createOrder(user, { symbol: 'BTCUSDT', quantity: 0.1, price: 50000, total: 5000 });
    await createPosition(user, { quantity: 0.02, entryPrice: 50000, initialMargin: 1000 });

    const response = await api()
      .get('/api/v1/portfolio')
      .set(authHeadersFor(user))
      .expect(200);

    expect(response.body.data.assets).toEqual(
      expect.arrayContaining([expect.objectContaining({ asset: 'BTC', currentPrice: 55000 })])
    );
    expect(response.body.data.openPositions).toHaveLength(1);
    expect(response.body.data.reservedUsdt).toBe(100);
  });

  it('rejects unauthorized access', async () => {
    await api().get('/api/v1/portfolio').expect(401);
  });
});

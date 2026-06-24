const { api } = require('../helpers/api');
const { authHeadersFor, createOrder, createUser } = require('../helpers/factories');

describe('trades integration', () => {
  it('fetches trade history', async () => {
    const { user } = await createUser();
    await createOrder(user, { symbol: 'BTCUSDT' });
    await createOrder(user, { symbol: 'ETHUSDT', price: 3000, total: 300 });

    const response = await api()
      .get('/api/v1/trades/history?page=1&limit=20')
      .set(authHeadersFor(user))
      .expect(200);

    expect(response.body.data.trades).toHaveLength(2);
    expect(response.body.data.pagination.totalRecords).toBe(2);
  });

  it('filters by symbol', async () => {
    const { user } = await createUser();
    await createOrder(user, { symbol: 'BTCUSDT' });
    await createOrder(user, { symbol: 'ETHUSDT', price: 3000, total: 300 });

    const response = await api()
      .get('/api/v1/trades/history?page=1&limit=20&symbol=ethusdt')
      .set(authHeadersFor(user))
      .expect(200);

    expect(response.body.data.trades).toHaveLength(1);
    expect(response.body.data.trades[0].symbol).toBe('ETHUSDT');
  });

  it('paginates trade history', async () => {
    const { user } = await createUser();
    await Promise.all([
      createOrder(user, { symbol: 'BTCUSDT' }),
      createOrder(user, { symbol: 'ETHUSDT', price: 3000, total: 300 }),
      createOrder(user, { symbol: 'SOLUSDT', price: 100, total: 50 }),
    ]);

    const response = await api()
      .get('/api/v1/trades/history?page=2&limit=2')
      .set(authHeadersFor(user))
      .expect(200);

    expect(response.body.data.trades).toHaveLength(1);
    expect(response.body.data.pagination).toEqual({
      page: 2,
      limit: 2,
      totalRecords: 3,
      totalPages: 2,
    });
  });

  it('rejects invalid query schema', async () => {
    const { user } = await createUser();

    const response = await api()
      .get('/api/v1/trades/history?page=0&limit=101&symbol=bad')
      .set(authHeadersFor(user))
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('rejects unauthorized access', async () => {
    await api().get('/api/v1/trades/history?page=1&limit=20').expect(401);
  });
});

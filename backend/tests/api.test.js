/**
 * Integration tests. They start an in-memory MongoDB (mongodb-memory-server),
 * so you do not need MongoDB running. The first run downloads a mongod binary (needs internet).
 */
process.env.JWT_SECRET = 'test_secret';
process.env.USE_DB_TRANSACTIONS = 'false';
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Stock = require('../models/Stock');

let mongod, userToken, adminToken, stockId;
const auth = (t) => ({ Authorization: `Bearer ${t}` });

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'Admin@123', role: 'admin' });
  const s = await Stock.create({ symbol: 'TEST', companyName: 'Test Corp', sector: 'IT', currentPrice: 100, historicalPrices: [{ date: new Date(), price: 100 }] });
  await Stock.create({ symbol: 'ABC', companyName: 'Alpha Beta', sector: 'Auto', currentPrice: 50 });
  stockId = s._id.toString();
});
afterAll(async () => { await mongoose.disconnect(); await mongod.stop(); });

describe('Authentication', () => {
  test('registers a user with ₹1,00,000 balance and role user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Ravi', email: 'ravi@test.com', password: 'secret1', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('user'); // cannot self-assign admin
    expect(res.body.user.virtualBalance).toBe(100000);
    expect(res.body.user.password).toBeUndefined();
    userToken = res.body.token;
  });
  test('rejects duplicate email and invalid input', async () => {
    expect((await request(app).post('/api/auth/register').send({ name: 'Ravi', email: 'ravi@test.com', password: 'secret1' })).status).toBe(409);
    expect((await request(app).post('/api/auth/register').send({ name: 'R', email: 'bad', password: '1' })).status).toBe(400);
  });
  test('stores a hashed password', async () => {
    const u = await User.findOne({ email: 'ravi@test.com' }).select('+password');
    expect(u.password).not.toBe('secret1');
    expect(u.password.startsWith('$2')).toBe(true);
  });
  test('login works and wrong password fails', async () => {
    expect((await request(app).post('/api/auth/login').send({ email: 'ravi@test.com', password: 'wrong' })).status).toBe(401);
    const ok = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@123' });
    expect(ok.status).toBe(200);
    adminToken = ok.body.token;
  });
  test('protected route needs a token', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set(auth(userToken))).status).toBe(200);
  });
});

describe('Stocks', () => {
  test('search by symbol / company name and filter by sector', async () => {
    expect((await request(app).get('/api/stocks?search=tes')).body.map((s) => s.symbol)).toEqual(['TEST']);
    expect((await request(app).get('/api/stocks?search=alpha')).body.map((s) => s.symbol)).toEqual(['ABC']);
    expect((await request(app).get('/api/stocks?sector=Auto')).body).toHaveLength(1);
  });
  test('stock details include history', async () => {
    const res = await request(app).get(`/api/stocks/${stockId}`);
    expect(res.body.historicalPrices.length).toBe(1);
  });
});

describe('Trading, balance, portfolio and history', () => {
  test('buy updates balance, portfolio and transactions', async () => {
    const res = await request(app).post('/api/trade/buy').set(auth(userToken)).send({ stockId, quantity: 10 });
    expect(res.status).toBe(201);
    expect(res.body.virtualBalance).toBe(99000);
    const p = await request(app).get('/api/portfolio').set(auth(userToken));
    expect(p.body.holdings[0]).toMatchObject({ quantity: 10, averagePrice: 100, invested: 1000 });
    expect(p.body.summary.netWorth).toBe(100000);
  });
  test('second buy at new price updates the average price', async () => {
    await Stock.updateOne({ _id: stockId }, { currentPrice: 120 });
    await request(app).post('/api/trade/buy').set(auth(userToken)).send({ stockId, quantity: 10 });
    const p = await request(app).get('/api/portfolio').set(auth(userToken));
    expect(p.body.holdings[0].quantity).toBe(20);
    expect(p.body.holdings[0].averagePrice).toBe(110);
    expect(p.body.summary.totalPnL).toBe(200); // 20*120 - 20*110
  });
  test('rejects insufficient balance, bad quantity and overselling', async () => {
    expect((await request(app).post('/api/trade/buy').set(auth(userToken)).send({ stockId, quantity: 100000 })).status).toBe(400);
    expect((await request(app).post('/api/trade/buy').set(auth(userToken)).send({ stockId, quantity: 0 })).status).toBe(400);
    expect((await request(app).post('/api/trade/buy').set(auth(userToken)).send({ stockId, quantity: 1.5 })).status).toBe(400);
    expect((await request(app).post('/api/trade/sell').set(auth(userToken)).send({ stockId, quantity: 21 })).status).toBe(400);
    const me = await request(app).get('/api/auth/me').set(auth(userToken));
    expect(me.body.user.virtualBalance).toBe(97800); // 100000 - 1000 - 1200, unchanged by failed trades
  });
  test('sell credits balance and removes empty holdings', async () => {
    const res = await request(app).post('/api/trade/sell').set(auth(userToken)).send({ stockId, quantity: 20 });
    expect(res.body.virtualBalance).toBe(100200); // 97800 + 20 x 120
    expect((await request(app).get('/api/portfolio').set(auth(userToken))).body.holdings).toHaveLength(0);
  });
  test('transaction history + filtering', async () => {
    const all = await request(app).get('/api/transactions').set(auth(userToken));
    expect(all.body).toHaveLength(3);
    expect((await request(app).get('/api/transactions?type=SELL').set(auth(userToken))).body).toHaveLength(1);
    expect((await request(app).get('/api/transactions?symbol=zzz').set(auth(userToken))).body).toHaveLength(0);
  });
});

describe('Admin permissions', () => {
  test('normal user is blocked, admin allowed', async () => {
    expect((await request(app).get('/api/admin/stats').set(auth(userToken))).status).toBe(403);
    expect((await request(app).post('/api/stocks').set(auth(userToken)).send({ symbol: 'X', companyName: 'X', currentPrice: 1 })).status).toBe(403);
    const stats = await request(app).get('/api/admin/stats').set(auth(adminToken));
    expect(stats.status).toBe(200);
    expect(stats.body.transactions).toBe(3);
  });
  test('admin stock CRUD', async () => {
    const c = await request(app).post('/api/stocks').set(auth(adminToken)).send({ symbol: 'new', companyName: 'New Co', currentPrice: 200 });
    expect(c.status).toBe(201);
    expect(c.body.symbol).toBe('NEW');
    const u = await request(app).put(`/api/stocks/${c.body._id}`).set(auth(adminToken)).send({ currentPrice: 220 });
    expect(u.body.dailyChange).toBe(10);
    expect((await request(app).delete(`/api/stocks/${c.body._id}`).set(auth(adminToken))).status).toBe(200);
    expect((await request(app).get('/api/admin/users').set(auth(adminToken))).body.length).toBe(2);
  });
});

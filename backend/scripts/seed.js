/**
 * Seed script.
 *   npm run seed         -> creates admin (from .env) + demo user + sample stocks (only if none exist)
 *   npm run seed:reset   -> ALSO wipes stocks, portfolios and transactions first
 * Prices are SAMPLE data for learning, not live market data.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');

const SAMPLE = [
  ['RELIANCE', 'Reliance Industries', 'Energy', 2900], ['TCS', 'Tata Consultancy Services', 'IT', 3900],
  ['INFY', 'Infosys', 'IT', 1550], ['WIPRO', 'Wipro', 'IT', 480],
  ['HDFCBANK', 'HDFC Bank', 'Banking', 1650], ['ICICIBANK', 'ICICI Bank', 'Banking', 1200],
  ['SBIN', 'State Bank of India', 'Banking', 780], ['ITC', 'ITC Limited', 'FMCG', 430],
  ['HINDUNILVR', 'Hindustan Unilever', 'FMCG', 2400], ['LT', 'Larsen & Toubro', 'Infrastructure', 3500],
  ['BHARTIARTL', 'Bharti Airtel', 'Telecom', 1450], ['MARUTI', 'Maruti Suzuki', 'Auto', 12500],
  ['TATAMOTORS', 'Tata Motors', 'Auto', 950], ['SUNPHARMA', 'Sun Pharmaceutical', 'Pharma', 1700],
];

// small deterministic random generator so seed data looks the same every time
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function buildStock([symbol, companyName, sector, base], idx) {
  const rand = rng(idx + 7);
  const days = 60;
  const prices = new Array(days);
  prices[days - 1] = base;
  for (let i = days - 2; i >= 0; i--) prices[i] = prices[i + 1] / (1 + (rand() - 0.5) * 0.04);
  const historicalPrices = prices.map((p, i) => {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (days - 1 - i));
    return { date: d, price: Math.round(p * 100) / 100 };
  });
  const last = historicalPrices[days - 1].price, prev = historicalPrices[days - 2].price;
  return {
    symbol, companyName, sector, currentPrice: last,
    dailyChange: Math.round(((last - prev) / prev) * 10000) / 100,
    volume: Math.floor(1000000 + rand() * 8000000), historicalPrices,
  };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  if (process.argv.includes('--reset')) {
    await Promise.all([Stock.deleteMany(), Portfolio.deleteMany(), Transaction.deleteMany()]);
    console.log('Cleared stocks, portfolios and transactions');
  }

  const { ADMIN_NAME = 'Administrator', ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.log('! ADMIN_EMAIL / ADMIN_PASSWORD not set in .env - skipping admin creation');
  } else if (await User.findOne({ email: ADMIN_EMAIL.toLowerCase() })) {
    console.log(`Admin ${ADMIN_EMAIL} already exists - left unchanged`);
  } else {
    await User.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  if (!(await User.findOne({ email: 'demo@example.com' }))) {
    await User.create({ name: 'Demo User', email: 'demo@example.com', password: 'Demo@123' });
    console.log('Demo user created: demo@example.com / Demo@123 (development only, delete before deploying)');
  }

  if ((await Stock.countDocuments()) === 0) {
    await Stock.insertMany(SAMPLE.map(buildStock));
    console.log(`Inserted ${SAMPLE.length} sample stocks`);
  } else console.log('Stocks already exist - skipped (use "npm run seed:reset" to start over)');

  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });

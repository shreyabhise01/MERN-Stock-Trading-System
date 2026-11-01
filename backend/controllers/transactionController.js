const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/error');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Builds a filter from ?type=BUY|SELL &symbol= &from=YYYY-MM-DD &to=YYYY-MM-DD
exports.buildFilter = (q) => {
  const f = {};
  if (['BUY', 'SELL'].includes(q.type)) f.transactionType = q.type;
  if (q.symbol) f.symbol = { $regex: escapeRegex(String(q.symbol).slice(0, 15)), $options: 'i' };
  if (q.from || q.to) {
    f.timestamp = {};
    if (q.from && !isNaN(new Date(q.from))) f.timestamp.$gte = new Date(q.from);
    if (q.to && !isNaN(new Date(q.to))) { const t = new Date(q.to); t.setHours(23, 59, 59, 999); f.timestamp.$lte = t; }
    if (!Object.keys(f.timestamp).length) delete f.timestamp;
  }
  return f;
};

// GET /api/transactions  (current user's history)
exports.getMyTransactions = asyncHandler(async (req, res) => {
  const filter = { ...exports.buildFilter(req.query), userId: req.user._id };
  res.json(await Transaction.find(filter).sort({ timestamp: -1 }).limit(500));
});

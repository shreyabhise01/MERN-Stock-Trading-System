const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');
const { buildFilter } = require('./transactionController');
const { asyncHandler } = require('../middleware/error');

// GET /api/admin/stats
exports.getStats = asyncHandler(async (req, res) => {
  const [users, stocks, transactions, volumeAgg, recent] = await Promise.all([
    User.countDocuments(), Stock.countDocuments(), Transaction.countDocuments(),
    Transaction.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Transaction.find().sort({ timestamp: -1 }).limit(5).populate('userId', 'name email'),
  ]);
  res.json({ users, stocks, transactions, totalTradedValue: volumeAgg[0]?.total || 0, recentTransactions: recent });
});

// GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => res.json(await User.find().select('-password').sort({ createdAt: -1 })));

// GET /api/admin/transactions  (all users, same filters as user history)
exports.getAllTransactions = asyncHandler(async (req, res) => {
  res.json(await Transaction.find(buildFilter(req.query)).sort({ timestamp: -1 }).limit(500).populate('userId', 'name email'));
});

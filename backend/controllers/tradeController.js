const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const Transaction = require('../models/Transaction');
const { ApiError, asyncHandler } = require('../middleware/error');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Runs one trade. `session` is a MongoDB session when transactions are enabled, otherwise null.
 * Without a session we rely on atomic conditional updates (balance / quantity guards)
 * and undo steps if a later step fails.
 */
async function executeTrade(session, userId, stockId, type, qty) {
  const opts = { session };
  const stock = await Stock.findById(stockId).session(session);
  if (!stock) throw new ApiError(404, 'Stock not found');
  const price = stock.currentPrice;
  const total = round2(price * qty);
  const undo = [];

  try {
    if (type === 'BUY') {
      // atomic: only debits if the balance is sufficient
      const user = await User.findOneAndUpdate(
        { _id: userId, virtualBalance: { $gte: total } }, { $inc: { virtualBalance: -total } }, { new: true, ...opts }
      );
      if (!user) throw new ApiError(400, 'Insufficient virtual balance');
      undo.push(() => User.updateOne({ _id: userId }, { $inc: { virtualBalance: total } }));

      const holding = await Portfolio.findOne({ userId, stockId }).session(session);
      if (holding) {
        const newQty = holding.quantity + qty;
        holding.averagePrice = round2((holding.averagePrice * holding.quantity + total) / newQty);
        holding.quantity = newQty;
        await holding.save(opts);
      } else {
        await Portfolio.create([{ userId, stockId, quantity: qty, averagePrice: price }], opts);
      }
    } else {
      // atomic: only decrements if the user owns enough shares
      const holding = await Portfolio.findOneAndUpdate(
        { userId, stockId, quantity: { $gte: qty } }, { $inc: { quantity: -qty } }, { new: true, ...opts }
      );
      if (!holding) throw new ApiError(400, 'You do not own enough shares to sell');
      const avg = holding.averagePrice;
      undo.push(() => Portfolio.updateOne({ userId, stockId }, { $inc: { quantity: qty }, $setOnInsert: { averagePrice: avg } }, { upsert: true }));
      if (holding.quantity === 0) await Portfolio.deleteOne({ _id: holding._id }, opts);
      await User.updateOne({ _id: userId }, { $inc: { virtualBalance: total } }, opts);
    }
    const [txn] = await Transaction.create(
      [{ userId, stockId, symbol: stock.symbol, companyName: stock.companyName, transactionType: type, quantity: qty, price, totalAmount: total }],
      opts
    );
    return txn;
  } catch (err) {
    if (!session) for (const step of undo.reverse()) await step().catch(() => {});
    throw err;
  }
}

// POST /api/trade/buy and /api/trade/sell   body: { stockId, quantity }
exports.trade = (type) => asyncHandler(async (req, res) => {
  const { stockId } = req.body;
  const qty = Number(req.body.quantity);
  let txn;
  if (process.env.USE_DB_TRANSACTIONS === 'true') {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => { txn = await executeTrade(session, req.user._id, stockId, type, qty); });
    } finally {
      await session.endSession();
    }
  } else {
    txn = await executeTrade(null, req.user._id, stockId, type, qty);
  }
  const user = await User.findById(req.user._id);
  res.status(201).json({
    message: `${type === 'BUY' ? 'Bought' : 'Sold'} ${qty} x ${txn.symbol} at ₹${txn.price}`,
    transaction: txn,
    virtualBalance: user.virtualBalance,
  });
});

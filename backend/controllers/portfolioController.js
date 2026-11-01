const Portfolio = require('../models/Portfolio');
const { asyncHandler } = require('../middleware/error');

const round2 = (n) => Math.round(n * 100) / 100;

// GET /api/portfolio
exports.getPortfolio = asyncHandler(async (req, res) => {
  const rows = await Portfolio.find({ userId: req.user._id, quantity: { $gt: 0 } })
    .populate('stockId', 'symbol companyName currentPrice dailyChange sector');
  const holdings = rows.filter((r) => r.stockId).map((r) => {
    const invested = round2(r.quantity * r.averagePrice);
    const currentValue = round2(r.quantity * r.stockId.currentPrice);
    const pnl = round2(currentValue - invested);
    return {
      _id: r._id, stock: r.stockId, quantity: r.quantity, averagePrice: r.averagePrice,
      currentPrice: r.stockId.currentPrice, invested, currentValue, pnl,
      pnlPercent: invested ? round2((pnl / invested) * 100) : 0,
    };
  });
  const totalInvested = round2(holdings.reduce((s, h) => s + h.invested, 0));
  const currentValue = round2(holdings.reduce((s, h) => s + h.currentValue, 0));
  const totalPnL = round2(currentValue - totalInvested);
  res.json({
    holdings,
    summary: {
      totalInvested, currentValue, totalPnL,
      pnlPercent: totalInvested ? round2((totalPnL / totalInvested) * 100) : 0,
      virtualBalance: req.user.virtualBalance,
      netWorth: round2(req.user.virtualBalance + currentValue),
    },
  });
});

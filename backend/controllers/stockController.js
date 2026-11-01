const Stock = require('../models/Stock');
const Portfolio = require('../models/Portfolio');
const { ApiError, asyncHandler } = require('../middleware/error');

const round2 = (n) => Math.round(n * 100) / 100;
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const FIELDS = ['symbol', 'companyName', 'sector', 'currentPrice', 'dailyChange', 'volume'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// GET /api/stocks?search=&sector=&sort=
exports.getStocks = asyncHandler(async (req, res) => {
  const { search, sector, sort } = req.query;
  const query = {};
  if (search) {
    const s = escapeRegex(String(search).slice(0, 50));
    query.$or = [{ symbol: { $regex: s, $options: 'i' } }, { companyName: { $regex: s, $options: 'i' } }];
  }
  if (sector && sector !== 'All') query.sector = String(sector);
  const sorts = {
    price_asc: { currentPrice: 1 }, price_desc: { currentPrice: -1 },
    gainers: { dailyChange: -1 }, losers: { dailyChange: 1 }, volume: { volume: -1 }, name: { symbol: 1 },
  };
  const stocks = await Stock.find(query).select('-historicalPrices').sort(sorts[sort] || { symbol: 1 });
  res.json(stocks);
});

// GET /api/stocks/sectors
exports.getSectors = asyncHandler(async (req, res) => res.json((await Stock.distinct('sector')).sort()));

// GET /api/stocks/:id  (includes historicalPrices for charts)
exports.getStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id);
  if (!stock) throw new ApiError(404, 'Stock not found');
  res.json(stock);
});

// POST /api/stocks  (admin)
exports.createStock = asyncHandler(async (req, res) => {
  const data = pick(req.body);
  data.historicalPrices = [{ date: new Date(), price: round2(Number(data.currentPrice)) }];
  const stock = await Stock.create(data);
  res.status(201).json(stock);
});

// PUT /api/stocks/:id  (admin) - a price change also updates dailyChange and price history
exports.updateStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id);
  if (!stock) throw new ApiError(404, 'Stock not found');
  const data = pick(req.body);
  if (data.currentPrice !== undefined && Number(data.currentPrice) !== stock.currentPrice) {
    if (data.dailyChange === undefined) {
      data.dailyChange = round2(((Number(data.currentPrice) - stock.currentPrice) / stock.currentPrice) * 100);
    }
    stock.historicalPrices.push({ date: new Date(), price: round2(Number(data.currentPrice)) });
  }
  stock.set(data);
  await stock.save();
  res.json(stock);
});

// DELETE /api/stocks/:id  (admin) - blocked while users still hold shares
exports.deleteStock = asyncHandler(async (req, res) => {
  const stock = await Stock.findById(req.params.id);
  if (!stock) throw new ApiError(404, 'Stock not found');
  if (await Portfolio.exists({ stockId: stock._id, quantity: { $gt: 0 } })) {
    throw new ApiError(400, 'Cannot delete: users currently hold shares of this stock');
  }
  await stock.deleteOne();
  res.json({ message: `${stock.symbol} deleted` });
});

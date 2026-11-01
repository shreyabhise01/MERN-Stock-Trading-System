const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
  // snapshot so history stays readable even if the stock is later removed
  symbol: { type: String, required: true },
  companyName: { type: String, required: true },
  transactionType: { type: String, enum: ['BUY', 'SELL'], required: true },
  quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'], validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' } },
  price: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  timestamp: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('Transaction', transactionSchema);

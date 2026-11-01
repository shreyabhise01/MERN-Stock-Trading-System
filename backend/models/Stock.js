const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: [true, 'Symbol is required'], unique: true, uppercase: true, trim: true, maxlength: 15 },
    companyName: { type: String, required: [true, 'Company name is required'], trim: true, maxlength: 100 },
    sector: { type: String, trim: true, default: 'General' },
    currentPrice: { type: Number, required: [true, 'Price is required'], min: [0.01, 'Price must be greater than 0'] },
    dailyChange: { type: Number, default: 0 }, // percent change today
    volume: { type: Number, default: 0, min: [0, 'Volume cannot be negative'] },
    historicalPrices: [{ _id: false, date: { type: Date, required: true }, price: { type: Number, required: true } }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Stock', stockSchema);

const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    stockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Stock', required: true },
    quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
    averagePrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// one holding row per user per stock
portfolioSchema.index({ userId: 1, stockId: 1 }, { unique: true });

module.exports = mongoose.model('Portfolio', portfolioSchema);

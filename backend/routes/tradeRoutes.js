const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { trade } = require('../controllers/tradeController');

const rules = [
  body('stockId').isMongoId().withMessage('Valid stockId is required'),
  body('quantity').isInt({ min: 1, max: 100000 }).withMessage('Quantity must be a whole number between 1 and 100000'),
];

router.post('/buy', protect, rules, validate, trade('BUY'));
router.post('/sell', protect, rules, validate, trade('SELL'));

module.exports = router;

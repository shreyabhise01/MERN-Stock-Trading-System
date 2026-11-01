const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/stockController');

const rules = (isCreate) => [
  body('symbol').if(() => isCreate).trim().notEmpty().withMessage('Symbol is required').isLength({ max: 15 }),
  body('companyName').if(() => isCreate).trim().notEmpty().withMessage('Company name is required'),
  body('currentPrice').if((v, { req }) => isCreate || req.body.currentPrice !== undefined)
    .isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('volume').optional().isInt({ min: 0 }).withMessage('Volume must be a non-negative whole number'),
  body('dailyChange').optional().isFloat({ min: -100, max: 1000 }).withMessage('Daily change must be a number'),
];

router.get('/', c.getStocks);
router.get('/sectors', c.getSectors);
router.get('/:id', c.getStock);
router.post('/', protect, authorize('admin'), rules(true), validate, c.createStock);
router.put('/:id', protect, authorize('admin'), rules(false), validate, c.updateStock);
router.delete('/:id', protect, authorize('admin'), c.deleteStock);

module.exports = router;

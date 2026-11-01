const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getPortfolio } = require('../controllers/portfolioController');

router.get('/', protect, getPortfolio);

module.exports = router;

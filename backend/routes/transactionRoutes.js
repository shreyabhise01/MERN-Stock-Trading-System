const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getMyTransactions } = require('../controllers/transactionController');

router.get('/', protect, getMyTransactions);

module.exports = router;

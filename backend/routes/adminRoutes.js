const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { getStats, getUsers, getAllTransactions } = require('../controllers/adminController');

router.use(protect, authorize('admin'));
router.get('/stats', getStats);
router.get('/users', getUsers);
router.get('/transactions', getAllTransactions);

module.exports = router;

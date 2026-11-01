const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('../middleware/error');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, virtualBalance: u.virtualBalance });

// POST /api/auth/register  (role is ALWAYS "user"; admins are created via the seed script)
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Invalid email or password');
  res.json({ token: signToken(user._id), user: publicUser(user) });
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));

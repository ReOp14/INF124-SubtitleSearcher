const jwt = require('jsonwebtoken');
const User = require('../models/User');

// In-memory blacklist for logged out tokens
const tokenBlacklist = new Set();

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token
      token = req.headers.authorization.split(' ')[1];

      // Check if token has been logged out
      if (tokenBlacklist.has(token)) {
        return res.status(401).json({ message: 'Token has been logged out, please login again' });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect, tokenBlacklist };

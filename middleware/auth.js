const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 1. Check if this is the hardcoded admin payload
      if (decoded.id === 'hardcoded_admin' || decoded.role === 'admin') {
        req.user = {
          id: 'hardcoded_admin',
          role: 'admin',
          name: 'Admin'
        };
        return next(); // Return early so it doesn't search MongoDB
      }

      // 2. Process standard database user
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      return next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // 3. Fallback if no token was sent at all
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Added a safety check using optional chaining (?.) to prevent 500 errors 
    // if req.user is undefined for any reason
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user?.role || 'Unknown'} is not authorized` 
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
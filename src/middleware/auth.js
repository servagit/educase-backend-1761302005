const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Unauthorized - Invalid token format' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    // Only log the error type and endpoint, not the full stack trace for common JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      console.log(`Auth failed: ${error.name} on ${req.method} ${req.path}`);
    } else {
      console.error('Authentication error:', error);
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized - Token expired' });
    }
    
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized - User not authenticated' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { authMiddleware, authorize }; 
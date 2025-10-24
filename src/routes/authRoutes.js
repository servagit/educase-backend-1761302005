const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  updateUser,
  getUsers
} = require('../controllers/authController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

// User management routes (protected)
router.get('/users', authMiddleware, getUsers);
router.put('/users/:id', authMiddleware, updateUser);

module.exports = router; 
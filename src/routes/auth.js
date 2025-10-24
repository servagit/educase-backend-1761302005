const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Don't add cors here if it's already applied globally
// router.use(cors()); <- Remove if present

router.post('/login', authController.login);
router.post('/register', authController.register);
// other auth routes...

module.exports = router; 
const express = require('express');
const { 
  getAnnexures, 
  getAnnexureById, 
  uploadAnnexure, 
  deleteAnnexure 
} = require('../controllers/annexureController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all annexures
router.get('/', authorize(['teacher', 'admin']), getAnnexures);

// Get a single annexure by ID
router.get('/:id', authorize(['teacher', 'admin']), getAnnexureById);

// Upload a new annexure
router.post('/upload', authorize(['teacher', 'admin']), uploadAnnexure);

// Delete an annexure
router.delete('/:id', authorize(['teacher', 'admin']), deleteAnnexure);

module.exports = router; 
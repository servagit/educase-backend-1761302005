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
router.get('/', authorize(['teacher', 'administrator']), getAnnexures);

// Get a single annexure by ID
router.get('/:id', authorize(['teacher', 'administrator']), getAnnexureById);

// Upload a new annexure
router.post('/upload', authorize(['teacher', 'administrator']), uploadAnnexure);

// Delete an annexure
router.delete('/:id', authorize(['teacher', 'administrator']), deleteAnnexure);

module.exports = router; 
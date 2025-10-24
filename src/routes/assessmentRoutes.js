const express = require('express');
const { 
  getAssessments, 
  getAssessmentById, 
  createAssessment, 
  updateAssessment, 
  deleteAssessment,
  getAssessmentResults
} = require('../controllers/assessmentController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all assessments
router.get('/', authorize(['teacher', 'admin']), getAssessments);

// Get a single assessment by ID
router.get('/:id', authorize(['teacher', 'admin']), getAssessmentById);

// Create a new assessment
router.post('/', authorize(['teacher', 'admin']), createAssessment);

// Update an assessment
router.put('/:id', authorize(['teacher', 'admin']), updateAssessment);

// Delete an assessment
router.delete('/:id', authorize(['teacher', 'admin']), deleteAssessment);

// Get assessment results
router.get('/:id/results', authorize(['teacher', 'admin']), getAssessmentResults);

module.exports = router; 
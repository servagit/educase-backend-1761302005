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
router.get('/', authorize(['teacher', 'administrator']), getAssessments);

// Get a single assessment by ID
router.get('/:id', authorize(['teacher', 'administrator']), getAssessmentById);

// Create a new assessment
router.post('/', authorize(['teacher', 'administrator']), createAssessment);

// Update an assessment
router.put('/:id', authorize(['teacher', 'administrator']), updateAssessment);

// Delete an assessment
router.delete('/:id', authorize(['teacher', 'administrator']), deleteAssessment);

// Get assessment results
router.get('/:id/results', authorize(['teacher', 'administrator']), getAssessmentResults);

module.exports = router; 
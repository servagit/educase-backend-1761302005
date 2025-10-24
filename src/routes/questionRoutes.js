const express = require('express');
const { 
  getQuestions, 
  getQuestionById, 
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  uploadAddendum,
  getQuestionAddendums
} = require('../controllers/questionController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all questions (teachers and admins)
router.get('/', authorize(['teacher', 'admin']), getQuestions);

// Get a single question by ID
router.get('/:id', authorize(['teacher', 'admin']), getQuestionById);

// Create a new question
router.post('/', authorize(['teacher', 'admin']), createQuestion);

// Update a question
router.put('/:id', authorize(['teacher', 'admin']), updateQuestion);

// Delete a question
router.delete('/:id', authorize(['teacher', 'admin']), deleteQuestion);

// Get all addendums for a question
router.get('/:id/addendums', authorize(['teacher', 'admin']), getQuestionAddendums);

// Upload addendum for a question
router.post('/:id/addendum', authorize(['teacher', 'admin']), uploadAddendum);

module.exports = router; 
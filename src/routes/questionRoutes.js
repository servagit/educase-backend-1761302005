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

// Get all questions (teachers and administrators)
router.get('/', authorize(['teacher', 'administrator']), getQuestions);

// Get a single question by ID
router.get('/:id', authorize(['teacher', 'administrator']), getQuestionById);

// Create a new question
router.post('/', authorize(['teacher', 'administrator']), createQuestion);

// Update a question
router.put('/:id', authorize(['teacher', 'administrator']), updateQuestion);

// Delete a question
router.delete('/:id', authorize(['teacher', 'administrator']), deleteQuestion);

// Get all addendums for a question
router.get('/:id/addendums', authorize(['teacher', 'administrator']), getQuestionAddendums);

// Upload addendum for a question
router.post('/:id/addendum', authorize(['teacher', 'administrator']), uploadAddendum);

module.exports = router; 
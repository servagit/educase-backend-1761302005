const express = require('express');
const { 
  getQuestionPapers, 
  getQuestionPaperById, 
  createQuestionPaper, 
  updateQuestionPaper, 
  deleteQuestionPaper,
  generatePDF,
  getMyQuestionPapers,
  uploadPaperAddendum,
  getPaperAddendums
} = require('../controllers/questionPaperController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all question papers (teachers and administrators)
router.get('/', authorize(['teacher', 'administrator']), getQuestionPapers);

// Get question papers created by the current user
router.get('/my-papers', authorize(['teacher', 'administrator']), getMyQuestionPapers);

// Get a single question paper by ID
router.get('/:id', authorize(['teacher', 'administrator']), getQuestionPaperById);

// Create a new question paper
router.post('/', authorize(['teacher', 'administrator']), createQuestionPaper);

// Update a question paper
router.put('/:id', authorize(['teacher', 'administrator']), updateQuestionPaper);

// Delete a question paper
router.delete('/:id', authorize(['teacher', 'administrator']), deleteQuestionPaper);

// Generate PDF for a question paper
router.get('/:id/generate', authorize(['teacher', 'administrator']), generatePDF);

// Get all addendums for a question paper
router.get('/:id/addendums', authorize(['teacher', 'administrator']), getPaperAddendums);

// Upload addendum for a question paper
router.post('/:id/addendum', authorize(['teacher', 'administrator']), uploadPaperAddendum);

module.exports = router; 
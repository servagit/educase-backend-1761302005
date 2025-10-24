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

// Get all question papers (teachers and admins)
router.get('/', authorize(['teacher', 'admin']), getQuestionPapers);

// Get question papers created by the current user
router.get('/my-papers', authorize(['teacher', 'admin']), getMyQuestionPapers);

// Get a single question paper by ID
router.get('/:id', authorize(['teacher', 'admin']), getQuestionPaperById);

// Create a new question paper
router.post('/', authorize(['teacher', 'admin']), createQuestionPaper);

// Update a question paper
router.put('/:id', authorize(['teacher', 'admin']), updateQuestionPaper);

// Delete a question paper
router.delete('/:id', authorize(['teacher', 'admin']), deleteQuestionPaper);

// Generate PDF for a question paper
router.get('/:id/generate', authorize(['teacher', 'admin']), generatePDF);

// Get all addendums for a question paper
router.get('/:id/addendums', authorize(['teacher', 'admin']), getPaperAddendums);

// Upload addendum for a question paper
router.post('/:id/addendum', authorize(['teacher', 'admin']), uploadPaperAddendum);

module.exports = router; 
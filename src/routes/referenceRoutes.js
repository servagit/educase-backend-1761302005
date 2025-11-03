const express = require('express');
const { 
  getGrades, 
  getSubjects, 
  getTopics, 
  getTemplates,
  createTopic,
  createSubject,
  updateSubject,
  deleteSubject,
  updateTopic,
  deleteTopic
} = require('../controllers/referenceController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all grades
router.get('/grades', getGrades);

// Get all subjects
router.get('/subjects', getSubjects);

// Create a new subject
router.post('/subjects', createSubject);

// Update a subject
router.put('/subjects/:id', updateSubject);

// Delete a subject
router.delete('/subjects/:id', deleteSubject);

// Get topics with optional filtering
router.get('/topics', getTopics);

// Create a new topic
router.post('/topics', createTopic);

// Update a topic
router.put('/topics/:id', updateTopic);

// Delete a topic
router.delete('/topics/:id', deleteTopic);

// Get all templates
router.get('/templates', getTemplates);

module.exports = router; 
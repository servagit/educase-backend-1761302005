const express = require('express');
const { 
  getGrades, 
  getSubjects, 
  getTopics, 
  getTemplates,
  createTopic,
  createSubject
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

// Get topics with optional filtering
router.get('/topics', getTopics);

// Create a new topic
router.post('/topics', createTopic);

// Get all templates
router.get('/templates', getTemplates);

module.exports = router; 
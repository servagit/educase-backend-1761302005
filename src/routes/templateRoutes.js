const express = require('express');
const { 
  getTemplates, 
  getTemplateById, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate 
} = require('../controllers/templateController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all templates
router.get('/', authorize(['teacher', 'administrator']), getTemplates);

// Get a single template by ID
router.get('/:id', authorize(['teacher', 'administrator']), getTemplateById);

// Create a new template
router.post('/', authorize(['teacher', 'administrator']), createTemplate);

// Update a template
router.put('/:id', authorize(['teacher', 'administrator']), updateTemplate);

// Delete a template
router.delete('/:id', authorize(['administrator']), deleteTemplate);

module.exports = router; 
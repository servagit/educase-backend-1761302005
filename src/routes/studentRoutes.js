const express = require('express');
const { 
  getStudents, 
  getStudentById, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  getStudentsByTeacher,
  getMyStudents
} = require('../controllers/studentController');
const { authMiddleware, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all students (administrator only)
router.get('/', authorize(['administrator']), getStudents);

// Get students by teacher ID (administrator and teachers)
router.get('/by-teacher', authorize(['administrator', 'teacher']), getStudentsByTeacher);

// Get current teacher's students
router.get('/my-students', authorize(['teacher']), getMyStudents);

// IMPORTANT: These specific routes must come BEFORE the parameterized routes
// to prevent the "my-students" path from being treated as an ID

// Get a single student by ID
router.get('/:id', authorize(['administrator', 'teacher']), getStudentById);

// Create a new student
router.post('/', authorize(['administrator', 'teacher']), createStudent);

// Update a student
router.put('/:id', authorize(['administrator', 'teacher']), updateStudent);

// Delete a student
router.delete('/:id', authorize(['administrator']), deleteStudent);

module.exports = router; 
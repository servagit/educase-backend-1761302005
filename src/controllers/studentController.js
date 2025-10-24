const supabase = require('../utils/supabase');

// Get all students with optional filtering
const getStudents = async (req, res) => {
  try {
    const { name, grade, page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .range(from, to);
      
    // Apply filters if provided
    if (name) query = query.ilike('name', `%${name}%`);
    if (grade) query = query.eq('grade', grade);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
    
    // Return students with pagination info
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getStudents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: student, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching student:', error);
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error in getStudentById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new student
const createStudent = async (req, res) => {
  try {
    const { name, grade, user_id } = req.body;
    
    // Validate required fields
    if (!name || !grade) {
      return res.status(400).json({ error: 'Name and grade are required' });
    }
    
    const { data: newStudent, error } = await supabase
      .from('students')
      .insert([{ name, grade, user_id }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating student:', error);
      return res.status(500).json({ error: 'Failed to create student' });
    }
    
    res.status(201).json(newStudent);
  } catch (error) {
    console.error('Error in createStudent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, user_id } = req.body;
    
    const { data: updatedStudent, error } = await supabase
      .from('students')
      .update({ name, grade, user_id })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating student:', error);
      return res.status(500).json({ error: 'Failed to update student' });
    }
    
    res.json(updatedStudent);
  } catch (error) {
    console.error('Error in updateStudent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting student:', error);
      return res.status(500).json({ error: 'Failed to delete student' });
    }
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error in deleteStudent:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a student's assessments
const getStudentAssessments = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('student_assessments')
      .select(`
        *,
        assessments (
          *,
          question_papers (
            id, title, subject_id, grade_id,
            subjects (id, name),
            grades (id, level)
          )
        )
      `, { count: 'exact' })
      .eq('student_id', id)
      .range(from, to);
      
    if (status) query = query.eq('status', status);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching student assessments:', error);
      return res.status(500).json({ error: 'Failed to fetch student assessments' });
    }
    
    // Return assessments with pagination info
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getStudentAssessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get students for a specific teacher
const getStudentsByTeacher = async (req, res) => {
  try {
    const { teacher_id } = req.query;
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    if (!teacher_id) {
      return res.status(400).json({ error: 'Teacher ID is required' });
    }
    
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('teacher_id', teacher_id)
      .order('name', { ascending: true })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching students by teacher:', error);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
    
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getStudentsByTeacher:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get students for the current teacher
const getMyStudents = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Get the current user's ID from the auth middleware
    const teacherId = req.user.id;
    
    const { data, error, count } = await supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('teacher_id', teacherId)
      .order('name', { ascending: true })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching teacher\'s students:', error);
      return res.status(500).json({ error: 'Failed to fetch students' });
    }
    
    res.json({
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getMyStudents:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentAssessments,
  getStudentsByTeacher,
  getMyStudents
}; 
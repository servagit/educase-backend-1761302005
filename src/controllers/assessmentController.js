const supabase = require('../utils/supabase');

// Get all assessments with optional filtering
const getAssessments = async (req, res) => {
  try {
    const { 
      question_paper_id, 
      assigned_by,
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('assessments')
      .select(`
        *,
        question_papers (
          id, title, subject_id, grade_id,
          subjects (id, name),
          grades (id, level)
        ),
        users!assigned_by (id, name)
      `, { count: 'exact' })
      .range(from, to);
      
    // Apply filters if provided
    if (question_paper_id) query = query.eq('question_paper_id', question_paper_id);
    if (assigned_by) query = query.eq('assigned_by', assigned_by);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching assessments:', error);
      return res.status(500).json({ error: 'Failed to fetch assessments' });
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
    console.error('Error in getAssessments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single assessment by ID
const getAssessmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: assessment, error } = await supabase
      .from('assessments')
      .select(`
        *,
        question_papers (
          *,
          subjects (id, name),
          grades (id, level)
        ),
        users!assigned_by (id, name)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching assessment:', error);
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    res.json(assessment);
  } catch (error) {
    console.error('Error in getAssessmentById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new assessment
const createAssessment = async (req, res) => {
  try {
    const { 
      question_paper_id, 
      due_date,
      student_ids 
    } = req.body;
    
    // Validate required fields
    if (!question_paper_id || !student_ids || !Array.isArray(student_ids)) {
      return res.status(400).json({ 
        error: 'Question paper ID and an array of student IDs are required' 
      });
    }
    
    // Create the assessment
    const { data: newAssessment, error } = await supabase
      .from('assessments')
      .insert([{ 
        question_paper_id, 
        assigned_by: req.user.id,
        due_date
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating assessment:', error);
      return res.status(500).json({ error: 'Failed to create assessment' });
    }
    
    // Assign the assessment to students
    const studentAssignments = student_ids.map(student_id => ({
      student_id,
      assessment_id: newAssessment.id,
      status: 'assigned'
    }));
    
    const { error: assignmentError } = await supabase
      .from('student_assessments')
      .insert(studentAssignments);
      
    if (assignmentError) {
      console.error('Error assigning to students:', assignmentError);
      // Continue anyway, we'll return the assessment
    }
    
    res.status(201).json(newAssessment);
  } catch (error) {
    console.error('Error in createAssessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update an assessment
const updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    const { due_date } = req.body;
    
    // Check if assessment exists and user has permission
    const { data: existingAssessment, error: fetchError } = await supabase
      .from('assessments')
      .select('assigned_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingAssessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    // Only allow the creator or admin to update
    if (existingAssessment.assigned_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { data: updatedAssessment, error } = await supabase
      .from('assessments')
      .update({ due_date })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating assessment:', error);
      return res.status(500).json({ error: 'Failed to update assessment' });
    }
    
    res.json(updatedAssessment);
  } catch (error) {
    console.error('Error in updateAssessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete an assessment
const deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if assessment exists and user has permission
    const { data: existingAssessment, error: fetchError } = await supabase
      .from('assessments')
      .select('assigned_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingAssessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }
    
    // Only allow the creator or admin to delete
    if (existingAssessment.assigned_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting assessment:', error);
      return res.status(500).json({ error: 'Failed to delete assessment' });
    }
    
    res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAssessment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get assessment results
const getAssessmentResults = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: results, error } = await supabase
      .from('student_assessments')
      .select(`
        *,
        students (id, name, grade)
      `)
      .eq('assessment_id', id)
      .order('score', { ascending: false });
      
    if (error) {
      console.error('Error fetching assessment results:', error);
      return res.status(500).json({ error: 'Failed to fetch assessment results' });
    }
    
    // Calculate statistics
    let totalStudents = results.length;
    let completedCount = 0;
    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = Infinity;
    
    results.forEach(result => {
      if (result.status === 'completed' || result.status === 'marked') {
        completedCount++;
        if (result.score !== null) {
          totalScore += result.score;
          highestScore = Math.max(highestScore, result.score);
          lowestScore = Math.min(lowestScore, result.score);
        }
      }
    });
    
    const averageScore = completedCount > 0 ? totalScore / completedCount : 0;
    
    // If no completed assessments, set lowest score to 0
    if (lowestScore === Infinity) {
      lowestScore = 0;
    }
    
    res.json({
      results,
      statistics: {
        totalStudents,
        completedCount,
        completionRate: totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0,
        averageScore,
        highestScore,
        lowestScore
      }
    });
  } catch (error) {
    console.error('Error in getAssessmentResults:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAssessments,
  getAssessmentById,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  getAssessmentResults
}; 
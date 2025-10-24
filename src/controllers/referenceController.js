const supabase = require('../utils/supabase');

// Get all grades
const getGrades = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .order('level', { ascending: true });
      
    if (error) {
      console.error('Error fetching grades:', error);
      return res.status(500).json({ error: 'Failed to fetch grades' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in getGrades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all subjects
const getSubjects = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching subjects:', error);
      return res.status(500).json({ error: 'Failed to fetch subjects' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in getSubjects:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new subject
const createSubject = async (req, res) => {
  try {
    const { name } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if subject with this name already exists
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('id')
      .eq('name', name)
      .single();
      
    if (existingSubject) {
      return res.status(409).json({ error: 'Subject with this name already exists' });
    }
    
    // Create the subject
    const { data: newSubject, error } = await supabase
      .from('subjects')
      .insert([{ name }])
      .select('*')
      .single();
      
    if (error) {
      console.error('Error creating subject:', error);
      return res.status(500).json({ error: 'Failed to create subject' });
    }
    
    res.status(201).json(newSubject);
  } catch (error) {
    console.error('Error in createSubject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get topics with optional filtering by grade and subject
const getTopics = async (req, res) => {
  try {
    const { grade_id, subject_id } = req.query;
    
    let query = supabase
      .from('topics')
      .select(`
        *,
        subjects (id, name),
        grades (id, level)
      `)
      .order('name', { ascending: true });
      
    if (grade_id) query = query.eq('grade_id', grade_id);
    if (subject_id) query = query.eq('subject_id', subject_id);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching topics:', error);
      return res.status(500).json({ error: 'Failed to fetch topics' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error in getTopics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new topic
const createTopic = async (req, res) => {
  try {
    const { name, subject_id, grade_id } = req.body;
    
    // Validate required fields
    if (!name || !subject_id || !grade_id) {
      return res.status(400).json({ error: 'Name, subject ID, and grade ID are required' });
    }
    
    // Check if subject exists
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', subject_id)
      .single();
      
    if (subjectError || !subject) {
      return res.status(400).json({ error: 'Invalid subject ID' });
    }
    
    // Check if grade exists
    const { data: grade, error: gradeError } = await supabase
      .from('grades')
      .select('id')
      .eq('id', grade_id)
      .single();
      
    if (gradeError || !grade) {
      return res.status(400).json({ error: 'Invalid grade ID' });
    }
    
    // Create the topic
    const { data: newTopic, error } = await supabase
      .from('topics')
      .insert([{
        name,
        subject_id,
        grade_id
      }])
      .select(`
        *,
        subjects (id, name),
        grades (id, level)
      `)
      .single();
      
    if (error) {
      console.error('Error creating topic:', error);
      return res.status(500).json({ error: 'Failed to create topic' });
    }
    
    res.status(201).json(newTopic);
  } catch (error) {
    console.error('Error in createTopic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all templates with filtering
const getTemplates = async (req, res) => {
  try {
    const { topic_id, grade_id, subject_id, page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('templates')
      .select(`
        *,
        users!created_by (id, name)
      `, { count: 'exact' })
      .order('title', { ascending: true })
      .range(from, to);
      
    // Apply filters if provided
    if (topic_id) query = query.eq('topic_id', topic_id);
    if (grade_id) query = query.eq('grade_id', grade_id);
    if (subject_id) query = query.eq('subject_id', subject_id);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching templates:', error);
      return res.status(500).json({ error: 'Failed to fetch templates' });
    }
    
    // Return templates with pagination info
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
    console.error('Error in getTemplates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getGrades,
  getSubjects,
  createSubject,
  getTopics,
  createTopic,
  getTemplates
}; 
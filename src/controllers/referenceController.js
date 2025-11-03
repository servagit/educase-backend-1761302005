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
    const { name, description } = req.body;
    
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
      .insert([{ name, description: description || null }])
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

// Update a subject
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    // Validate that at least one field is provided
    if (!name && description === undefined) {
      return res.status(400).json({ error: 'At least one field (name or description) is required' });
    }
    
    // Check if subject exists
    const { data: existingSubject, error: checkExistsError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', id)
      .single();
      
    if (checkExistsError || !existingSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // If name is being updated, check if another subject with this name already exists
    if (name) {
      const { data: duplicateSubject, error: checkDuplicateError } = await supabase
        .from('subjects')
        .select('id')
        .eq('name', name)
        .neq('id', id)
        .single();
        
      if (duplicateSubject) {
        return res.status(409).json({ error: 'Subject with this name already exists' });
      }
    }
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Update the subject
    const { data: updatedSubject, error } = await supabase
      .from('subjects')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();
      
    if (error) {
      console.error('Error updating subject:', error);
      return res.status(500).json({ error: 'Failed to update subject' });
    }
    
    res.json(updatedSubject);
  } catch (error) {
    console.error('Error in updateSubject:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a subject
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if subject exists
    const { data: existingSubject, error: checkError } = await supabase
      .from('subjects')
      .select('id')
      .eq('id', id)
      .single();
      
    if (checkError || !existingSubject) {
      return res.status(404).json({ error: 'Subject not found' });
    }
    
    // Check if subject is being used by any topics
    const { data: topics, error: topicsError } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', id)
      .limit(1);
      
    if (topicsError) {
      console.error('Error checking topics:', topicsError);
      return res.status(500).json({ error: 'Failed to check subject dependencies' });
    }
    
    if (topics && topics.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete subject. It is being used by one or more topics.' 
      });
    }
    
    // Delete the subject
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting subject:', error);
      return res.status(500).json({ error: 'Failed to delete subject' });
    }
    
    res.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error in deleteSubject:', error);
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

// Update a topic
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject_id, grade_id } = req.body;
    
    // Validate that at least one field is provided
    if (!name && !subject_id && !grade_id) {
      return res.status(400).json({ error: 'At least one field (name, subject_id, or grade_id) is required' });
    }
    
    // Check if topic exists
    const { data: existingTopic, error: checkExistsError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', id)
      .single();
      
    if (checkExistsError || !existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    
    // If subject_id is being updated, validate it exists
    if (subject_id) {
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('id')
        .eq('id', subject_id)
        .single();
        
      if (subjectError || !subject) {
        return res.status(400).json({ error: 'Invalid subject ID' });
      }
      updateData.subject_id = subject_id;
    }
    
    // If grade_id is being updated, validate it exists
    if (grade_id) {
      const { data: grade, error: gradeError } = await supabase
        .from('grades')
        .select('id')
        .eq('id', grade_id)
        .single();
        
      if (gradeError || !grade) {
        return res.status(400).json({ error: 'Invalid grade ID' });
      }
      updateData.grade_id = grade_id;
    }
    
    // Update the topic
    const { data: updatedTopic, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        subjects (id, name),
        grades (id, level)
      `)
      .single();
      
    if (error) {
      console.error('Error updating topic:', error);
      return res.status(500).json({ error: 'Failed to update topic' });
    }
    
    res.json(updatedTopic);
  } catch (error) {
    console.error('Error in updateTopic:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a topic
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if topic exists
    const { data: existingTopic, error: checkError } = await supabase
      .from('topics')
      .select('id')
      .eq('id', id)
      .single();
      
    if (checkError || !existingTopic) {
      return res.status(404).json({ error: 'Topic not found' });
    }
    
    // Check if topic is being used by any questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id')
      .eq('topic_id', id)
      .limit(1);
      
    if (questionsError) {
      console.error('Error checking questions:', questionsError);
      return res.status(500).json({ error: 'Failed to check topic dependencies' });
    }
    
    if (questions && questions.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete topic. It is being used by one or more questions.' 
      });
    }
    
    // Delete the topic
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting topic:', error);
      return res.status(500).json({ error: 'Failed to delete topic' });
    }
    
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTopic:', error);
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
  updateSubject,
  deleteSubject,
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getTemplates
}; 
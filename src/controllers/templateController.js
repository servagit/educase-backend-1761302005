const supabase = require('../utils/supabase');

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
        users!created_by (id, name),
        subjects (id, name),
        grades (id, level),
        topics (id, name)
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

// Get a single template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: template, error } = await supabase
      .from('templates')
      .select(`
        *,
        users!created_by (id, name),
        subjects (id, name),
        grades (id, level),
        topics (id, name)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching template:', error);
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error in getTemplateById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new template
const createTemplate = async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      description, 
      image_url, 
      subject_id, 
      grade_id, 
      topic_id 
    } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const { data: newTemplate, error } = await supabase
      .from('templates')
      .insert([{ 
        title, 
        subtitle, 
        description, 
        image_url, 
        subject_id, 
        grade_id, 
        topic_id,
        created_by: req.user.id 
      }])
      .select(`
        *,
        users!created_by (id, name),
        subjects (id, name),
        grades (id, level),
        topics (id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error creating template:', error);
      return res.status(500).json({ error: 'Failed to create template' });
    }
    
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error in createTemplate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      subtitle, 
      description, 
      image_url, 
      subject_id, 
      grade_id, 
      topic_id 
    } = req.body;
    
    // Check if template exists and user has permission
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Only allow the creator or admin to update
    if (existingTemplate.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Update the template
    const { data: updatedTemplate, error } = await supabase
      .from('templates')
      .update({ 
        title, 
        subtitle, 
        description, 
        image_url, 
        subject_id, 
        grade_id, 
        topic_id 
      })
      .eq('id', id)
      .select(`
        *,
        users!created_by (id, name),
        subjects (id, name),
        grades (id, level),
        topics (id, name)
      `)
      .single();
      
    if (error) {
      console.error('Error updating template:', error);
      return res.status(500).json({ error: 'Failed to update template' });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error in updateTemplate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if template exists and user has permission
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('templates')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Only allow the creator or admin to delete
    if (existingTemplate.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Delete the template
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting template:', error);
      return res.status(500).json({ error: 'Failed to delete template' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error in deleteTemplate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
}; 
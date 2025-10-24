const supabase = require('../utils/supabase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for addendum uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/addendums');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, images, and Word documents are allowed'));
    }
    
    cb(null, true);
  }
}).single('file');

// Get all questions with filtering
const getQuestions = async (req, res) => {
  try {
    const {
      topic_id,
      difficulty,
      type,
      cognitive_level,
      parent_id,
      created_by,
      page = 1,
      limit = 20,
      include_subquestions = 'true'
    } = req.query;

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build the select query with all necessary fields
    let selectQuery = `
      *,
      topics (
        id,
        name,
        grade_id,
        subject_id,
        grades (id, level),
        subjects (id, name)
      ),
      users!created_by (id, name)
    `;

    // Start building the query
    let query = supabase
      .from('questions')
      .select(selectQuery, { count: 'exact' });

    // Handle multiple topic_ids
    if (topic_id) {
      if (Array.isArray(topic_id)) {
        query = query.in('topic_id', topic_id);
      } else if (topic_id.includes(',')) {
        const topicIds = topic_id.split(',').map(id => parseInt(id.trim(), 10));
        query = query.in('topic_id', topicIds);
      } else {
        query = query.eq('topic_id', topic_id);
      }
    }

    // Apply other filters
    if (difficulty) query = query.eq('difficulty', difficulty);
    if (type) query = query.eq('type', type);
    if (cognitive_level) query = query.eq('cognitive_level', cognitive_level);
    if (created_by) query = query.eq('created_by', created_by);
    
    // Filter by parent_id (or get only top-level questions)
    if (parent_id !== undefined) {
      if (parent_id === 'null') {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parent_id);
      }
    }

    // Apply pagination
    query = query.range(from, to);

    // Execute the query
    const { data: questions, error, count } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }

    // Process questions to handle different types of content
    let processedQuestions = questions.map(question => {
      const processed = { ...question };
      
      // Process table data if it exists
      if (question.table_data) {
        try {
          // If table_data is stored as a string, parse it
          if (typeof question.table_data === 'string') {
            processed.table_data = JSON.parse(question.table_data);
          }
          
          // Add formatted HTML version of the table
          processed.table_html = formatTableToHTML(processed.table_data);
        } catch (e) {
          console.error(`Error processing table data for question ${question.id}:`, e);
          processed.table_data = null;
          processed.table_html = null;
        }
      }

      // Process LaTeX content if it exists
      if (question.latex) {
        processed.has_latex = true;
      }

      // Add content type indicators
      processed.content_types = {
        has_text: Boolean(question.text),
        has_latex: Boolean(question.latex),
        has_table: Boolean(processed.table_data),
        has_image: Boolean(question.image_url) // If you have image support
      };
      
      return processed;
    });

    // If include_subquestions is true, fetch subquestions for each parent question
    if (include_subquestions === 'true' && processedQuestions.length > 0) {
      const parentIds = processedQuestions
        .filter(q => q.parent_id === null)
        .map(q => q.id);
      
      if (parentIds.length > 0) {
        const { data: subQuestions, error: subError } = await supabase
          .from('questions')
          .select('*')
          .in('parent_id', parentIds)
          .order('number', { ascending: true });
        
        if (subError) {
          console.error('Error fetching subquestions:', subError);
        } else if (subQuestions && subQuestions.length > 0) {
          // Process subquestions content
          const processedSubs = subQuestions.map(sub => {
            const processed = { ...sub };
            
            // Process table data for subquestions
            if (sub.table_data) {
              try {
                if (typeof sub.table_data === 'string') {
                  processed.table_data = JSON.parse(sub.table_data);
                }
                processed.table_html = formatTableToHTML(processed.table_data);
              } catch (e) {
                console.error(`Error processing table data for subquestion ${sub.id}:`, e);
                processed.table_data = null;
                processed.table_html = null;
              }
            }

            // Process LaTeX content if it exists
            if (sub.latex) {
              processed.has_latex = true;
            }

            // Add content type indicators for subquestions
            processed.content_types = {
              has_text: Boolean(sub.text),
              has_latex: Boolean(sub.latex),
              has_table: Boolean(processed.table_data),
              has_image: Boolean(sub.image_url)
            };
            
            return processed;
          });

          // Group processed subquestions by parent_id
          const subsByParent = {};
          processedSubs.forEach(sub => {
            if (!subsByParent[sub.parent_id]) {
              subsByParent[sub.parent_id] = [];
            }
            subsByParent[sub.parent_id].push(sub);
          });
          
          // Add processed subquestions to their parent questions
          processedQuestions = processedQuestions.map(question => {
            if (question.parent_id === null && subsByParent[question.id]) {
              return {
                ...question,
                sub_questions: subsByParent[question.id]
              };
            }
            return question;
          });
        }
      }
    }
    
    res.json({
      data: processedQuestions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error in getQuestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to format table data to HTML
const formatTableToHTML = (tableData) => {
  if (!tableData || !tableData.headers || !tableData.rows) {
    return null;
  }

  try {
    let html = '<table class="question-table">\n';
    
    // Add headers
    html += '  <thead>\n    <tr>\n';
    tableData.headers.forEach(header => {
      html += `      <th>${header}</th>\n`;
    });
    html += '    </tr>\n  </thead>\n';
    
    // Add rows
    html += '  <tbody>\n';
    tableData.rows.forEach(row => {
      html += '    <tr>\n';
      row.forEach(cell => {
        html += `      <td>${cell}</td>\n`;
      });
      html += '    </tr>\n';
    });
    html += '  </tbody>\n</table>';
    
    return html;
  } catch (e) {
    console.error('Error formatting table to HTML:', e);
    return null;
  }
};

// Get a single question by ID
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the main question
    const { data: question, error } = await supabase
      .from('questions')
      .select(`
        *,
        topics (id, name),
        users!created_by (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching question:', error);
      return res.status(404).json({ error: 'Question not found' });
    }

    // Get sub-questions if any
    const { data: subQuestions, error: subError } = await supabase
      .from('questions')
      .select('*')
      .eq('parent_id', id)
      .order('number', { ascending: true });

    if (subError) {
      console.error('Error fetching sub-questions:', subError);
    }

    // Combine main question with sub-questions
    const result = {
      ...question,
      sub_questions: subQuestions || []
    };

    res.json(result);
  } catch (error) {
    console.error('Error in getQuestionById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new question
const createQuestion = async (req, res) => {
  try {
    const {
      number,
      description,
      text,
      latex,
      table_data,
      difficulty,
      marks,
      type,
      cognitive_level,
      memo,
      topic_id,
      parent_id,
      sub_questions
    } = req.body;

    // Validate required fields
    if (!marks || !type || !difficulty) {
      return res.status(400).json({ error: 'Marks, type, and difficulty are required fields' });
    }

    // Create the main question
    const { data: newQuestion, error } = await supabase
      .from('questions')
      .insert([
        {
          number,
          description,
          text,
          latex,
          table_data,
          difficulty,
          marks,
          type,
          cognitive_level,
          memo,
          topic_id,
          parent_id,
          created_by: req.user.id,
          updated_at: new Date()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating question:', error);
      return res.status(500).json({ error: 'Failed to create question' });
    }

    // Create sub-questions if provided
    if (sub_questions && Array.isArray(sub_questions) && sub_questions.length > 0) {
      const subQuestionsToInsert = sub_questions.map(sq => ({
        ...sq,
        parent_id: newQuestion.id,
        created_by: req.user.id,
        updated_at: new Date()
      }));

      const { data: newSubQuestions, error: subError } = await supabase
        .from('questions')
        .insert(subQuestionsToInsert)
        .select();

      if (subError) {
        console.error('Error creating sub-questions:', subError);
        // Continue anyway, we'll return the main question
      } else {
        newQuestion.sub_questions = newSubQuestions;
      }
    }

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error in createQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a question
const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      number,
      description,
      text,
      latex,
      table_data,
      difficulty,
      marks,
      type,
      cognitive_level,
      memo,
      topic_id,
      parent_id
    } = req.body;

    // Check if question exists and user has permission
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Only allow the creator or admin to update
    if (existingQuestion.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Update the question
    const { data: updatedQuestion, error } = await supabase
      .from('questions')
      .update({
        number,
        description,
        text,
        latex,
        table_data,
        difficulty,
        marks,
        type,
        cognitive_level,
        memo,
        topic_id,
        parent_id,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating question:', error);
      return res.status(500).json({ error: 'Failed to update question' });
    }

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if question exists and user has permission
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Only allow the creator or admin to delete
    if (existingQuestion.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete the question (cascade will handle sub-questions)
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question:', error);
      return res.status(500).json({ error: 'Failed to delete question' });
    }

    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload addendum for a question
const uploadAddendum = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const { id } = req.params; // Question ID
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Check if question exists and user has permission
      const { data: existingQuestion, error: fetchError } = await supabase
        .from('questions')
        .select('created_by')
        .eq('id', id)
        .single();

      if (fetchError || !existingQuestion) {
        return res.status(404).json({ error: 'Question not found' });
      }

      // Only allow the creator or admin to add addendums
      if (existingQuestion.created_by !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      
      const { title, description } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }
      
      // Determine file type from mimetype
      const fileType = req.file.mimetype.split('/')[0] === 'application' 
        ? req.file.mimetype.includes('pdf') ? 'pdf' : 'document'
        : 'image';
      
      // Upload file to Supabase Storage
      const filePath = req.file.path;
      const fileContent = fs.readFileSync(filePath);
      const fileName = req.file.filename;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('addendums')
        .upload(fileName, fileContent, {
          contentType: req.file.mimetype,
          upsert: false
        });
        
      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        return res.status(500).json({ error: 'Failed to upload file to storage' });
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('addendums')
        .getPublicUrl(fileName);
      
      // Create thumbnail for images
      let thumbnailUrl = null;
      if (fileType === 'image') {
        // For simplicity, we're using the same image as thumbnail
        thumbnailUrl = publicUrl;
      }
      
      // Create addendum record in database
      const { data: newAddendum, error } = await supabase
        .from('question_addendums')
        .insert([{
          question_id: id,
          title,
          description,
          file_type: fileType,
          file_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          created_by: req.user.id,
          created_at: new Date()
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating addendum record:', error);
        return res.status(500).json({ error: 'Failed to create addendum record' });
      }
      
      // Clean up local file
      fs.unlinkSync(filePath);
      
      res.status(201).json(newAddendum);
    } catch (error) {
      console.error('Error in uploadAddendum:', error);
      // Clean up local file if it exists
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting local file:', unlinkError);
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

// Get all addendums for a question
const getQuestionAddendums = async (req, res) => {
  try {
    const { id } = req.params; // Question ID
    
    // Check if question exists
    const { data: existingQuestion, error: fetchError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingQuestion) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    // Get all addendums for this question
    const { data: addendums, error } = await supabase
      .from('question_addendums')
      .select(`
        *,
        users!created_by (id, name)
      `)
      .eq('question_id', id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching addendums:', error);
      return res.status(500).json({ error: 'Failed to fetch addendums' });
    }
    
    res.json(addendums);
  } catch (error) {
    console.error('Error in getQuestionAddendums:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  uploadAddendum,
  getQuestionAddendums
}; 
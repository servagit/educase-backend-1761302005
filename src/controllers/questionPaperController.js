const supabase = require('../utils/supabase');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Configure multer for addendum uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/paper_addendums');
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

// Get all question papers with filtering
const getQuestionPapers = async (req, res) => {
  try {
    const {
      subject_id,
      grade_id,
      assessment_type,
      user_id,
      page = 1,
      limit = 20
    } = req.query;

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Start building the query
    let query = supabase
      .from('question_papers')
      .select(`
        *,
        subjects (id, name),
        grades (id, level),
        users!user_id (id, name)
      `, { count: 'exact' })
      .range(from, to);

    // Apply filters if provided
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (grade_id) query = query.eq('grade_id', grade_id);
    if (assessment_type) query = query.eq('assessment_type', assessment_type);
    if (user_id) query = query.eq('user_id', user_id);

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching question papers:', error);
      return res.status(500).json({ error: 'Failed to fetch question papers' });
    }

    // Return question papers with pagination info
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
    console.error('Error in getQuestionPapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single question paper by ID
const getQuestionPaperById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the question paper
    const { data: questionPaper, error } = await supabase
      .from('question_papers')
      .select(`
        *,
        subjects (id, name),
        grades (id, level),
        users!created_by (id, name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching question paper:', error);
      return res.status(404).json({ error: 'Question paper not found' });
    }

    // Get questions in this paper
    const { data: paperQuestions, error: questionsError } = await supabase
      .from('question_paper_questions')
      .select(`
        *,
        questions (*)
      `)
      .eq('question_paper_id', id)
      .order('question_order', { ascending: true });

    if (questionsError) {
      console.error('Error fetching paper questions:', questionsError);
    }

    // Combine question paper with its questions
    const result = {
      ...questionPaper,
      questions: paperQuestions ? paperQuestions.map(pq => ({
        ...pq.questions,
        order: pq.question_order
      })) : []
    };

    res.json(result);
  } catch (error) {
    console.error('Error in getQuestionPaperById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new question paper
const createQuestionPaper = async (req, res) => {
  try {
    const {
      title,
      subject_id,
      grade_id,
      assessment_type,
      assessment_date,
      instructions,
      questions
    } = req.body;

    // Validate required fields
    if (!title || !subject_id || !grade_id) {
      return res.status(400).json({ error: 'Title, subject, and grade are required' });
    }

    // Start a transaction
    const { data: questionPaper, error } = await supabase
      .from('question_papers')
      .insert([{
        title,
        subject_id,
        grade_id,
        assessment_type,
        assessment_date,
        instructions,
        created_by: req.user.id,
        user_id: req.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating question paper:', error);
      return res.status(500).json({ error: 'Failed to create question paper' });
    }

    // If questions are provided, add them to the question paper
    if (questions && questions.length > 0) {
      const questionPaperQuestions = questions.map((questionId, index) => ({
        question_paper_id: questionPaper.id,
        question_id: questionId,
        question_order: index + 1
      }));

      const { error: questionsError } = await supabase
        .from('question_paper_questions')
        .insert(questionPaperQuestions);

      if (questionsError) {
        console.error('Error adding questions to paper:', questionsError);
        return res.status(500).json({ error: 'Failed to add questions to paper' });
      }
    }

    res.status(201).json(questionPaper);
  } catch (error) {
    console.error('Error in createQuestionPaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a question paper
const updateQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subject_id,
      grade_id,
      assessment_type,
      assessment_date,
      instructions,
      questions
    } = req.body;

    // Check if question paper exists and user has permission
    const { data: existingPaper, error: fetchError } = await supabase
      .from('question_papers')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingPaper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }

    // Only allow the creator or admin to update
    if (existingPaper.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Update the question paper
    const { data: updatedPaper, error } = await supabase
      .from('question_papers')
      .update({
        title,
        subject_id,
        grade_id,
        assessment_type,
        assessment_date,
        instructions,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating question paper:', error);
      return res.status(500).json({ error: 'Failed to update question paper' });
    }

    // Update questions if provided
    if (questions && Array.isArray(questions)) {
      // First, remove all existing questions
      const { error: deleteError } = await supabase
        .from('question_paper_questions')
        .delete()
        .eq('question_paper_id', id);

      if (deleteError) {
        console.error('Error removing existing questions:', deleteError);
      } else if (questions.length > 0) {
        // Then add the new questions
        const questionsToInsert = questions.map((q, index) => ({
          question_paper_id: id,
          question_id: q.id,
          question_order: q.order || index + 1
        }));

        const { error: insertError } = await supabase
          .from('question_paper_questions')
          .insert(questionsToInsert);

        if (insertError) {
          console.error('Error adding questions to paper:', insertError);
        }
      }
    }

    res.json(updatedPaper);
  } catch (error) {
    console.error('Error in updateQuestionPaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a question paper
const deleteQuestionPaper = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if question paper exists and user has permission
    const { data: existingPaper, error: fetchError } = await supabase
      .from('question_papers')
      .select('created_by')
      .eq('id', id)
      .single();

    if (fetchError || !existingPaper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }

    // Only allow the creator or admin to delete
    if (existingPaper.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Delete the question paper (cascade will handle question_paper_questions)
    const { error } = await supabase
      .from('question_papers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting question paper:', error);
      return res.status(500).json({ error: 'Failed to delete question paper' });
    }

    res.json({ message: 'Question paper deleted successfully' });
  } catch (error) {
    console.error('Error in deleteQuestionPaper:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate PDF for a question paper
const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the question paper with all details
    const { data: paper, error: paperError } = await supabase
      .from('question_papers')
      .select(`
        *,
        subjects (name),
        grades (level)
      `)
      .eq('id', id)
      .single();
      
    if (paperError || !paper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    
    // Get questions in this paper
    const { data: paperQuestions, error: questionsError } = await supabase
      .from('question_paper_questions')
      .select(`
        question_order,
        questions (*)
      `)
      .eq('question_paper_id', id)
      .order('question_order', { ascending: true });
      
    if (questionsError) {
      console.error('Error fetching paper questions:', questionsError);
      return res.status(500).json({ error: 'Failed to fetch questions' });
    }
    
    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set up the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${paper.title.replace(/\s+/g, '_')}.pdf`);
    
    // Pipe the PDF to the response
    doc.pipe(res);
    
    // Add content to the PDF
    doc.fontSize(18).text(paper.title, { align: 'center' });
    doc.moveDown();
    
    if (paper.subjects) {
      doc.fontSize(12).text(`Subject: ${paper.subjects.name}`, { align: 'center' });
    }
    
    if (paper.grades) {
      doc.fontSize(12).text(`Grade: ${paper.grades.level}`, { align: 'center' });
    }
    
    if (paper.assessment_type) {
      doc.fontSize(12).text(`Type: ${paper.assessment_type}`, { align: 'center' });
    }
    
    doc.moveDown();
    
    // Add instructions if available
    if (paper.instructions) {
      doc.fontSize(12).font('Helvetica-Bold').text('Instructions:');
      doc.font('Helvetica').text(paper.instructions);
      doc.moveDown();
    }
    
    // Add questions
    let totalMarks = 0;
    
    paperQuestions.forEach((item, index) => {
      const question = item.questions;
      totalMarks += question.marks || 0;
      
      doc.fontSize(12).font('Helvetica-Bold').text(`Question ${question.number || index + 1} [${question.marks} marks]`);
      doc.font('Helvetica');
      
      if (question.description) {
        doc.text(question.description);
      }
      
      if (question.text) {
        doc.text(question.text);
      }
      
      // Note: LaTeX rendering in PDF would require additional libraries
      // For now, we'll just include the raw LaTeX
      if (question.latex) {
        doc.font('Courier').text(question.latex);
        doc.font('Helvetica');
      }
      
      doc.moveDown();
    });
    
    // Add total marks at the end
    doc.moveDown();
    doc.fontSize(12).font('Helvetica-Bold').text(`Total: ${totalMarks} marks`, { align: 'right' });
    
    // Finalize the PDF
    doc.end();
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// Get question papers created by the current user
const getMyQuestionPapers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // Get the current user's ID from the auth middleware
    const userId = req.user.id;
    
    // Query question papers created by this user
    const { data, error, count } = await supabase
      .from('question_papers')
      .select(`
        *,
        subjects (id, name),
        grades (id, level)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
      
    if (error) {
      console.error('Error fetching user question papers:', error);
      return res.status(500).json({ error: 'Failed to fetch question papers' });
    }
    
    // Return question papers with pagination info
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
    console.error('Error in getMyQuestionPapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload addendum for a question paper
const uploadPaperAddendum = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      const { id } = req.params; // Question Paper ID
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Check if question paper exists and user has permission
      const { data: existingPaper, error: fetchError } = await supabase
        .from('question_papers')
        .select('created_by')
        .eq('id', id)
        .single();

      if (fetchError || !existingPaper) {
        return res.status(404).json({ error: 'Question paper not found' });
      }

      // Only allow the creator or admin to add addendums
      if (existingPaper.created_by !== req.user.id && req.user.role !== 'admin') {
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
        .from('paper_addendums')
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
        .from('paper_addendums')
        .getPublicUrl(fileName);
      
      // Create thumbnail for images
      let thumbnailUrl = null;
      if (fileType === 'image') {
        // For simplicity, we're using the same image as thumbnail
        thumbnailUrl = publicUrl;
      }
      
      // Create addendum record in database
      const { data: newAddendum, error } = await supabase
        .from('paper_addendums')
        .insert([{
          question_paper_id: id,
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
        console.error('Error creating paper addendum record:', error);
        return res.status(500).json({ error: 'Failed to create paper addendum record' });
      }
      
      // Clean up local file
      fs.unlinkSync(filePath);
      
      res.status(201).json(newAddendum);
    } catch (error) {
      console.error('Error in uploadPaperAddendum:', error);
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

// Get all addendums for a question paper
const getPaperAddendums = async (req, res) => {
  try {
    const { id } = req.params; // Question Paper ID
    
    // Check if question paper exists
    const { data: existingPaper, error: fetchError } = await supabase
      .from('question_papers')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingPaper) {
      return res.status(404).json({ error: 'Question paper not found' });
    }
    
    // Get all addendums for this question paper
    const { data: addendums, error } = await supabase
      .from('paper_addendums')
      .select(`
        *,
        users!created_by (id, name)
      `)
      .eq('question_paper_id', id)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching paper addendums:', error);
      return res.status(500).json({ error: 'Failed to fetch paper addendums' });
    }
    
    res.json(addendums);
  } catch (error) {
    console.error('Error in getPaperAddendums:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getQuestionPapers,
  getQuestionPaperById,
  createQuestionPaper,
  updateQuestionPaper,
  deleteQuestionPaper,
  generatePDF,
  getMyQuestionPapers,
  uploadPaperAddendum,
  getPaperAddendums
}; 
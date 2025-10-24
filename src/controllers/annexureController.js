const supabase = require('../utils/supabase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
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

// Get all annexures with optional filtering
const getAnnexures = async (req, res) => {
  try {
    const { subject_id, file_type, created_by, page = 1, limit = 20 } = req.query;
    
    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    let query = supabase
      .from('annexures')
      .select(`
        *,
        subjects (id, name),
        users!created_by (id, name)
      `, { count: 'exact' })
      .range(from, to);
      
    // Apply filters if provided
    if (subject_id) query = query.eq('subject_id', subject_id);
    if (file_type) query = query.eq('file_type', file_type);
    if (created_by) query = query.eq('created_by', created_by);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching annexures:', error);
      return res.status(500).json({ error: 'Failed to fetch annexures' });
    }
    
    // Return annexures with pagination info
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
    console.error('Error in getAnnexures:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get a single annexure by ID
const getAnnexureById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: annexure, error } = await supabase
      .from('annexures')
      .select(`
        *,
        subjects (id, name),
        users!created_by (id, name)
      `)
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching annexure:', error);
      return res.status(404).json({ error: 'Annexure not found' });
    }
    
    res.json(annexure);
  } catch (error) {
    console.error('Error in getAnnexureById:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload a new annexure
const uploadAnnexure = async (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Multer error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      const { name, subject_id, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
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
        .from('annexures')
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
        .from('annexures')
        .getPublicUrl(fileName);
      
      // Create thumbnail for images
      let thumbnailUrl = null;
      if (fileType === 'image') {
        // For simplicity, we're using the same image as thumbnail
        // In a production app, you'd resize the image
        thumbnailUrl = publicUrl;
      }
      
      // Create annexure record in database
      const { data: newAnnexure, error } = await supabase
        .from('annexures')
        .insert([{
          name,
          subject_id,
          file_type: fileType,
          file_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          created_by: req.user.id
        }])
        .select()
        .single();
        
      if (error) {
        console.error('Error creating annexure record:', error);
        return res.status(500).json({ error: 'Failed to create annexure record' });
      }
      
      // Clean up local file
      fs.unlinkSync(filePath);
      
      res.status(201).json(newAnnexure);
    } catch (error) {
      console.error('Error in uploadAnnexure:', error);
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

// Delete an annexure
const deleteAnnexure = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if annexure exists and user has permission
    const { data: existingAnnexure, error: fetchError } = await supabase
      .from('annexures')
      .select('created_by, file_url')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingAnnexure) {
      return res.status(404).json({ error: 'Annexure not found' });
    }
    
    // Only allow the creator or admin to delete
    if (existingAnnexure.created_by !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Extract filename from URL
    const fileUrl = existingAnnexure.file_url;
    const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('annexures')
      .remove([fileName]);
      
    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue anyway to delete the database record
    }
    
    // Delete from database
    const { error } = await supabase
      .from('annexures')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting annexure record:', error);
      return res.status(500).json({ error: 'Failed to delete annexure' });
    }
    
    res.json({ message: 'Annexure deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAnnexure:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAnnexures,
  getAnnexureById,
  uploadAnnexure,
  deleteAnnexure
}; 
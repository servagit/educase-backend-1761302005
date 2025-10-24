const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');
require('dotenv').config();
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '24h';

// Register a new user
const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // Create user in Supabase
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([
        { 
          email, 
          password_hash, 
          name, 
          role: role || 'teacher',
          updated_at: new Date()
        }
      ])
      .select()
      .single();
      
    if (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return user data (excluding password) and token
    const { password_hash: _, ...userData } = newUser;
    
    res.status(201).json({
      message: 'User registered successfully',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return user data (excluding password) and token
    const { password_hash: _, ...userData } = user;
    
    res.json({
      message: 'Login successful',
      user: userData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', userId)
      .single();
      
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    // Only allow admin to access this endpoint
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied - Admin access required' });
    }
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at, updated_at')
      .order('name', { ascending: true });
      
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a user (admin only can update roles, users can update their own profiles)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, email } = req.body;
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Only admin can update roles
    if (role && req.user.role === 'admin') {
      updateData.role = role;
    } else if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only administrators can update user roles' });
    }
    
    // Only allow users to update their own profiles unless admin
    if (id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    // Add updated_at timestamp
    updateData.updated_at = new Date();
    
    // Update the user
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, role, created_at, updated_at')
      .single();
      
    if (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Request password reset (simplified version)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('email', email)
      .single();
      
    if (error || !user) {
      // For security reasons in a real app, don't reveal if the email exists
      // But for development, we'll be more explicit
      return res.status(404).json({ error: 'User not found with this email' });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Hash the token for storage
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Store the reset token in the database
    const { error: tokenError } = await supabase
      .from('password_resets')
      .upsert([
        {
          user_id: user.id,
          token: hashedToken,
          expires_at: resetTokenExpiry.toISOString()
        }
      ]);
      
    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return res.status(500).json({ error: 'Failed to process password reset request' });
    }
    
    // Instead of sending an email, return the token in the response
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    res.status(200).json({ 
      message: 'Password reset token generated successfully',
      resetToken: resetToken,
      resetUrl: resetUrl,
      expiresAt: resetTokenExpiry
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }
    
    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find the token in the database
    const { data: resetData, error: resetError } = await supabase
      .from('password_resets')
      .select('user_id, expires_at')
      .eq('token', hashedToken)
      .single();
      
    if (resetError || !resetData) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    
    // Check if token is expired
    if (new Date(resetData.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    
    // Hash the new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Update the user's password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', resetData.user_id);
      
    if (updateError) {
      console.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }
    
    // Delete the used token
    await supabase
      .from('password_resets')
      .delete()
      .eq('token', hashedToken);
    
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  getUsers,
  updateUser,
  requestPasswordReset,
  resetPassword
}; 
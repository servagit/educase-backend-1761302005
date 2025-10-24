const cors = require('cors');
require('dotenv').config();

// For debugging and fixing the immediate issue
const corsMiddleware = cors({
  origin: 'https://educase-frontend-chi.vercel.app', // Specify exact origin for credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
});

// Log middleware usage
console.log('CORS middleware configured');

module.exports = corsMiddleware; 
Educase Backend API
This repository contains the backend API for Educase, an educational assessment platform designed for teachers to create, manage, and distribute assessments to students.
Features
User Authentication: Register, login, password reset
Question Management: Create, update, and search questions by subject, grade, topic, and difficulty
Question Paper Creation: Assemble questions into complete assessment papers
Template System: Reusable templates for different assessment types
Student Management: Track students and assign assessments
PDF Generation: Generate printable assessment papers

Tech Stack
Node.js
Express.js
PostgreSQL (via Supabase)
JWT Authentication
API Endpoints
Authentication
POST /api/auth/register - Register a new user
POST /api/auth/login - Login and get JWT token
GET /api/auth/me - Get current user information
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password with token
Reference Data
GET /api/reference/grades - Get all grades
GET /api/reference/subjects - Get all subjects
GET /api/reference/topics - Get all topics (filterable by subject and grade)

Questions
GET /api/questions - Get all questions (with filtering options)
GET /api/questions/:id - Get a specific question
POST /api/questions - Create a new question
PUT /api/questions/:id - Update a question
DELETE /api/questions/:id - Delete a question
Question Papers
GET /api/question-papers - Get all question papers
GET /api/question-papers/my-papers - Get papers created by current user
GET /api/question-papers/:id - Get a specific question paper
POST /api/question-papers - Create a new question paper
PUT /api/question-papers/:id - Update a question paper
DELETE /api/question-papers/:id - Delete a question paper
GET /api/question-papers/:id/generate - Generate PDF for a question paper
Students
GET /api/students - Get all students (admin only)
GET /api/students/by-teacher - Get students by teacher ID
GET /api/students/my-students - Get current teacher's students
GET /api/students/:id - Get a specific student
POST /api/students - Create a new student
PUT /api/students/:id - Update a student
DELETE /api/students/:id - Delete a student
Templates
GET /api/templates - Get all templates
GET /api/templates/:id - Get a specific template
POST /api/templates - Create a new template
PUT /api/templates/:id - Update a template
DELETE /api/templates/:id - Delete a template
Getting Started
Prerequisites
Node.js (v14 or higher)
npm or yarn
PostgreSQL database (or Supabase account)
Installation
Clone the repository:
git clone https://github.com/vexperts-assemble/educase-backend.git
cd educase-backend


2. Install dependencies:
```bash
npm install
```


3. Create a `.env` file in the root directory with the following variables:
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
FRONTEND_URL=http://localhost:3000
```

4. Start the server:
```bash
npm start
```
npm run dev

Database Schema
The application uses the following main tables:
users
questions
question_papers
question_paper_questions
templates
students
subjects
grades
topics
password_resets

// This file contains database table definitions based on the actual schema

const DB_SCHEMA = {
  tables: {
    users: {
      id: 'serial primary key',
      email: 'varchar(255) unique not null',
      password_hash: 'varchar(255) not null',
      name: 'varchar(255) not null',
      role: 'varchar(50) not null', // 'teacher', 'admin', etc.
      created_at: 'timestamp with time zone default current_timestamp',
      updated_at: 'timestamp with time zone default current_timestamp'
    },
    
    grades: {
      id: 'serial primary key',
      level: 'varchar(10) not null', // '8', '9', '10', etc.
      description: 'varchar(255)'
    },
    
    subjects: {
      id: 'serial primary key',
      name: 'varchar(100) not null',
      description: 'text'
    },
    
    topics: {
      id: 'serial primary key',
      name: 'varchar(255) not null',
      subject_id: 'integer references subjects(id) on delete cascade',
      grade_id: 'integer references grades(id) on delete cascade'
    },
    
    questions: {
      id: 'serial primary key',
      number: 'varchar(20)', // e.g., '1', '2.1', etc.
      description: 'text',
      text: 'text',
      latex: 'text', // For storing LaTeX content
      difficulty: 'varchar(20) not null', // 'easy', 'medium', 'hard'
      marks: 'integer not null',
      type: 'varchar(50) not null', // 'multiple-choice', 'short-answer', etc.
      cognitive_level: 'varchar(50)', // 'knowledge', 'comprehension', 'application', etc.
      memo: 'text',
      topic_id: 'integer references topics(id) on delete set null',
      parent_id: 'integer references questions(id) on delete cascade', // For sub-questions
      created_by: 'integer references users(id) on delete set null',
      created_at: 'timestamp with time zone default current_timestamp',
      updated_at: 'timestamp with time zone default current_timestamp'
    },
    
    question_papers: {
      id: 'serial primary key',
      title: 'varchar(255) not null',
      subject_id: 'integer references subjects(id) on delete set null',
      grade_id: 'integer references grades(id) on delete set null',
      assessment_type: 'varchar(50)', // 'exam', 'test', 'quiz', etc.
      assessment_date: 'date',
      instructions: 'text',
      created_by: 'integer references users(id) on delete set null',
      created_at: 'timestamp with time zone default current_timestamp',
      updated_at: 'timestamp with time zone default current_timestamp'
    },
    
    question_paper_questions: {
      id: 'serial primary key',
      question_paper_id: 'integer references question_papers(id) on delete cascade',
      question_id: 'integer references questions(id) on delete cascade',
      question_order: 'integer not null' // For ordering questions in the paper
    },
    
    students: {
      id: 'serial primary key',
      name: 'varchar(255) not null',
      grade: 'varchar(10) not null',
      user_id: 'integer references users(id) on delete set null'
    },
    
    assessments: {
      id: 'serial primary key',
      question_paper_id: 'integer references question_papers(id) on delete cascade',
      assigned_by: 'integer references users(id) on delete set null',
      assigned_date: 'timestamp with time zone default current_timestamp',
      due_date: 'timestamp with time zone'
    },
    
    student_assessments: {
      id: 'serial primary key',
      student_id: 'integer references students(id) on delete cascade',
      assessment_id: 'integer references assessments(id) on delete cascade',
      status: 'varchar(20) default \'assigned\'', // 'assigned', 'in_progress', 'completed', 'marked'
      score: 'integer',
      total_marks: 'integer',
      confidence_rating: 'integer',
      completed_at: 'timestamp with time zone'
    },
    
    templates: {
      id: 'serial primary key',
      title: 'varchar(255) not null',
      subtitle: 'varchar(255)',
      description: 'text',
      image_url: 'text',
      created_by: 'integer references users(id) on delete set null',
      created_at: 'timestamp with time zone default current_timestamp'
    },
    
    annexures: {
      id: 'serial primary key',
      name: 'varchar(255) not null',
      subject_id: 'integer references subjects(id) on delete set null',
      file_type: 'varchar(50) not null', // 'pdf', 'image', etc.
      file_url: 'text not null',
      thumbnail_url: 'text',
      created_by: 'integer references users(id) on delete set null',
      created_at: 'timestamp with time zone default current_timestamp'
    }
  }
};

module.exports = DB_SCHEMA; 
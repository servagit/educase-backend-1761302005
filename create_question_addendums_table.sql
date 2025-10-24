-- Create question_addendums table
CREATE TABLE IF NOT EXISTS question_addendums (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_type VARCHAR(20) NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups by question
CREATE INDEX IF NOT EXISTS idx_question_addendums_question_id ON question_addendums(question_id);

-- Add index for looking up by creator
CREATE INDEX IF NOT EXISTS idx_question_addendums_created_by ON question_addendums(created_by);

-- Grant permissions (adjust as needed based on your Supabase setup)
ALTER TABLE question_addendums ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see addendums for questions they can access
CREATE POLICY "Users can view question addendums" 
  ON question_addendums
  FOR SELECT
  USING (true);

-- Policy to allow users to insert their own addendums
CREATE POLICY "Users can add their own addendums" 
  ON question_addendums
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Policy to allow users to update their own addendums
CREATE POLICY "Users can update their own addendums" 
  ON question_addendums
  FOR UPDATE
  USING (created_by = auth.uid());

-- Policy to allow users to delete their own addendums
CREATE POLICY "Users can delete their own addendums" 
  ON question_addendums
  FOR DELETE
  USING (created_by = auth.uid()); 
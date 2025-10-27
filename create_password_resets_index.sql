-- Add unique constraint and indexes to password_resets table for better performance and data integrity

-- Add unique constraint on token column
ALTER TABLE password_resets 
ADD CONSTRAINT password_resets_token_unique UNIQUE (token);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Optional: Add a function to automatically clean up expired tokens (run via a scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_password_resets()
RETURNS void AS $$
BEGIN
  DELETE FROM password_resets WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;


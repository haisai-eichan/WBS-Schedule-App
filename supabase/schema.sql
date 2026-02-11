-- Create the projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows anyone to select, insert, update, and delete
-- (Note: For production, you should restrict this to authenticated users)
CREATE POLICY "Enable all access for all users" ON projects
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add content column to article_versions for storing Markdown text
ALTER TABLE article_versions 
ADD COLUMN IF NOT EXISTS content TEXT;

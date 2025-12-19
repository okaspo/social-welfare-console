-- Protocol: Zero-Hallucination RAG Support
-- Date: 2025-12-19
-- Description: Enable pgvector, add embedding column to common_knowledge, create match function.

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to common_knowledge (formerly knowledge_items)
-- Attempt to handle both table names if uncertain, but relying on 'common_knowledge' as per previous log.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'common_knowledge') THEN
        ALTER TABLE common_knowledge ADD COLUMN IF NOT EXISTS embedding vector(1536);
        CREATE INDEX IF NOT EXISTS idx_common_knowledge_embedding ON common_knowledge USING hnsw (embedding vector_cosine_ops);
    END IF;
END $$;

-- 3. Create Vector Search Function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb, -- Construct metadata from title/category
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
      ck.id,
      ck.content,
      jsonb_build_object(
          'title', ck.title,
          'category', ck.category
      ) as metadata,
      1 - (ck.embedding <=> query_embedding) as similarity
    FROM common_knowledge ck
    WHERE 1 - (ck.embedding <=> query_embedding) > match_threshold
    AND ck.is_active = true
    ORDER BY ck.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

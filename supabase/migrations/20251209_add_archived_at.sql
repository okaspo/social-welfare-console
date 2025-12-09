-- Add archived_at column to knowledge_items for soft delete / archiving
ALTER TABLE public.knowledge_items
ADD COLUMN archived_at timestamp with time zone;

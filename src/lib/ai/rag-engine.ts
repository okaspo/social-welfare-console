import { createClient } from '@/lib/supabase/server';

interface SearchResult {
    id: string;
    content: string;
    metadata: {
        title: string;
        category: string;
    };
    similarity: number;
}

/**
 * Retrieve relevant context from Knowledge Base
 */
export async function retrieveKnowledge(
    query: string,
    similarityThreshold = 0.5,
    matchCount = 5
): Promise<string> {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Generate Embedding
    const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query.replace(/\n/g, ' '),
    });

    const embedding = embeddingResponse.data[0].embedding;

    // 2. Search Database
    const supabase = await createClient();
    const { data: documents, error } = await supabase.rpc('match_documents', {
        query_embedding: embedding,
        match_threshold: similarityThreshold,
        match_count: matchCount,
    });

    if (error) {
        console.error('Vector search failed:', error);
        return '';
    }

    if (!documents || documents.length === 0) {
        return '';
    }

    // 3. Format Context
    // Sort by checking strict category match logic if needed, but here simple mapping.
    return documents.map((doc: SearchResult) =>
        `[Source: ${doc.metadata.title}] (${Math.round(doc.similarity * 100)}% Match)\n${doc.content}`
    ).join('\n\n');
}

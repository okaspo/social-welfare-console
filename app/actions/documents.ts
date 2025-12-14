'use server';

import { createClient } from '@/lib/supabase/server';
import { checkUsage, incrementUsage } from '@/lib/usage-guard';
import { PlanType } from '@/lib/types';
import { convertFileToMarkdown } from '@/lib/processing/converter'; // Ensure path is correct



export async function uploadAndProcessDocument(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 1. Quota Check
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (!profile?.organization_id) throw new Error('Org not found');

    const { data: org } = await supabase
        .from('organizations')
        .select('plan_id')
        .eq('id', profile.organization_id)
        .single();

    const planId = (org?.plan_id || 'free') as PlanType;
    const fileSizeMB = file.size / (1024 * 1024);

    try {
        await checkUsage(profile.organization_id, planId, 'storage_mb', fileSizeMB);
    } catch (e: any) {
        throw new Error(e.message);
    }

    // 2. Upload to Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.organization_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
    }

    // 3. Process Content (MarkItDown)
    let content = '';
    try {
        content = await convertFileToMarkdown(buffer, file.type);
    } catch (e) {
        console.warn('Conversion failed, saving empty content', e);
    }

    // 4. Save to DB
    const { error: dbError } = await supabase
        .from('documents')
        .insert({
            organization_id: profile.organization_id,
            title: file.name,
            file_path: fileName,
            file_type: fileExt, // or mime type? schema says 'file_type' usually ext
            size_bytes: file.size,
            content: content,
            token_count: Math.ceil(content.length / 4)
        });

    if (dbError) {
        console.error('DB Insert Error:', dbError);
        throw new Error('Failed to save document metadata');
    }

    // 5. Increment Usage
    await incrementUsage(profile.organization_id, 'storage', fileSizeMB);
    // Maybe increment 'doc_gen' if we consider parsing as gen? probably not.

    return { success: true, fileName: file.name };
}

'use server';

import { createClient } from '@/lib/supabase/server';
import { checkUsage, incrementUsage } from '@/lib/usage-guard';
import { PlanType } from '@/lib/types';

export async function uploadFile(formData: FormData) {
    const file = formData.get('file') as File;
    if (!file) {
        throw new Error('No file provided');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Get Org & Plan
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

    // 2. Check Storage Quota
    const fileSizeMB = file.size / (1024 * 1024);

    // Hard limit for individual file (e.g. 50MB for Free) could be enforced here too if needed,
    // but the requirement says "Free... 50MB limit" (which might mean total or per file).
    // Usually quota is total. Let's assume the user meant "If total usage + this file > limit".
    // I updated checkUsage to handle this.

    try {
        await checkUsage(profile.organization_id, planId, 'storage_mb', fileSizeMB);
    } catch (e: any) {
        throw new Error(e.message);
    }

    // 3. Upload to Storage
    // Ensure bucket 'documents' exists!
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.organization_id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
    }

    // 4. Insert Metadata to DB
    const { error: dbError } = await supabase
        .from('documents')
        .insert({
            organization_id: profile.organization_id,
            title: file.name,
            file_path: fileName,
            file_type: file.type,
            size_bytes: file.size,
            // category? Assuming 'general' or null
        });

    if (dbError) {
        console.error('DB error:', dbError);
        throw new Error('Failed to save file metadata');
    }

    // 5. Increment Usage
    await incrementUsage(profile.organization_id, 'storage', fileSizeMB);

    return { success: true };
}

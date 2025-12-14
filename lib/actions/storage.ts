'use server'

import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * 署名付きアップロードURLを発行する
 */
export async function getSignedUploadUrl(
    fileName: string,
    fileType: string
) {
    const supabase = await createClient()

    // 1. 認証と組織IDの取得
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) throw new Error('Organization not found')

    // 2. 保存パスの構築: organization_id / yyyy / uuid.extension
    const ext = fileName.split('.').pop()
    const fileId = uuidv4()
    const year = new Date().getFullYear()
    const filePath = `${profile.organization_id}/${year}/${fileId}.${ext}`

    // 3. Signed Upload URLの発行
    const { data, error } = await supabase
        .storage
        .from('private_docs')
        .createSignedUploadUrl(filePath)

    if (error) throw new Error(error.message)

    return {
        signedUrl: data.signedUrl,
        token: data.token,
        path: filePath, // DB保存用にパスも返す
        fullPath: `private_docs/${filePath}`
    }
}

/**
 * アップロード完了後にDBへメタデータを保存する
 */
export async function saveDocumentMetadata(
    path: string,
    originalName: string,
    size: number,
    mimeType: string
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    // Organization IDの再取得（安全のため）
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single()

    // private_documentsテーブルへの保存
    const { error } = await supabase
        .from('private_documents')
        .insert({
            organization_id: profile?.organization_id,
            title: originalName,
            file_path: path,
            file_size: size,
            mime_type: mimeType,
            uploaded_by: user?.id,
            is_archived: false
        })

    if (error) throw new Error(error.message)
    return { success: true }
}

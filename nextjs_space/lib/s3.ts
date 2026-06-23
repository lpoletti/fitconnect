import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const BUCKET = 'exercise-media';

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  isPublic = false,
  userId?: string
) {
  const prefix = isPublic ? 'public/uploads' : 'uploads';
  const userPrefix = userId ? `${userId}` : 'anonymous';
  const cloud_storage_path = `${prefix}/${userPrefix}/${Date.now()}-${fileName}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUploadUrl(cloud_storage_path);

  if (error) throw error;

  return { uploadUrl: data.signedUrl, cloud_storage_path };
}

export async function getFileUrl(cloud_storage_path: string, _isPublic: boolean) {
  const { data } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(cloud_storage_path);

  return data.publicUrl;
}

export async function deleteFile(cloud_storage_path: string) {
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([cloud_storage_path]);

  if (error) throw error;
}

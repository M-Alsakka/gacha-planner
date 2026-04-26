import { supabase, SUPABASE_MEDIA_BUCKET } from './supabase';

export async function uploadPublicImage(file: File, folder: string) {
  const ext = file.name.split('.').pop() || 'png';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .getPublicUrl(path);

  return {
    imagePath: path,
    imageUrl: data.publicUrl,
  };
}

export async function deletePublicFile(path?: string | null) {
  if (!path) return;

  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .remove([path]);

  if (error) {
    throw error;
  }
}
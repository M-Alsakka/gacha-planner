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

export function getPublicFilePath(pathOrUrl?: string | null) {
  if (!pathOrUrl) return null;

  if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  try {
    const url = new URL(pathOrUrl);
    const publicBucketPrefix = `/storage/v1/object/public/${SUPABASE_MEDIA_BUCKET}/`;
    const prefixIndex = url.pathname.indexOf(publicBucketPrefix);

    if (prefixIndex === -1) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.slice(prefixIndex + publicBucketPrefix.length),
    );
  } catch {
    return null;
  }
}

export async function deletePublicFile(pathOrUrl?: string | null) {
  const path = getPublicFilePath(pathOrUrl);

  if (!path) return;

  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .remove([path]);

  if (error) {
    throw error;
  }
}

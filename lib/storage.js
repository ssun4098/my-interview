// Shared constants for the question-content file upload feature.
// Keep this in sync with the bucket created in supabase/schema.sql.

export const QUESTION_FILES_BUCKET = 'question-files';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, mirrors the bucket's file_size_limit
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

// Objects are stored as `{questionSetId}/{random}.{ext}` so storage RLS
// policies can authorize per-set access the same way question_sets/questions
// policies do. `/files/...` (app/files/[...path]/route.js) is the stable,
// permanent URL we embed in editor HTML — it resolves to a fresh signed URL
// on every request instead of us persisting a signed URL that would expire.
export function questionFilePath(setId, file) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = crypto.randomUUID();
  return `${setId}/${random}${ext ? `.${ext}` : ''}`;
}

export function fileUrlFromPath(path) {
  return `/files/${path}`;
}

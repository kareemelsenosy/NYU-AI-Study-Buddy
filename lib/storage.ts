import { createServerClient } from '@/lib/supabase';
import { FileMetadata } from '@/types';

// Bucket name — override via SUPABASE_STORAGE_BUCKET env var if needed
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'course-files';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const CONTENT_TYPE_MAP: Record<string, string> = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
};

// ── Bucket health check ───────────────────────────────────────────────────────
// Cached flag so we only verify/create once per server process lifetime.
let bucketReady = false;

export async function ensureBucket(): Promise<{ ok: boolean; bucket: string; message: string }> {
  if (bucketReady) return { ok: true, bucket: BUCKET, message: 'Bucket ready (cached)' };

  const supabase = createServerClient();

  // Try to get the bucket metadata
  const { data: existing, error: getError } = await supabase.storage.getBucket(BUCKET);

  if (existing) {
    console.log(`[STORAGE] ✅ Bucket '${BUCKET}' exists and is accessible`);
    bucketReady = true;
    return { ok: true, bucket: BUCKET, message: `Bucket '${BUCKET}' exists` };
  }

  // If the error is anything other than "not found", it's a credentials/config issue
  const isNotFound =
    getError?.message?.toLowerCase().includes('not found') ||
    getError?.message?.toLowerCase().includes('does not exist') ||
    getError?.message?.toLowerCase().includes('nosuchbucket');

  if (!isNotFound) {
    const msg = `Storage configuration error: ${getError?.message}. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.`;
    console.error(`[STORAGE] ❌ ${msg}`);
    return { ok: false, bucket: BUCKET, message: msg };
  }

  // Bucket doesn't exist — create it with public access so getPublicUrl works
  console.log(`[STORAGE] 🪣 Bucket '${BUCKET}' not found — creating...`);
  const { error: createError } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ],
    fileSizeLimit: MAX_FILE_SIZE,
  });

  if (createError) {
    const msg = `Failed to create bucket '${BUCKET}': ${createError.message}. Create it manually in the Supabase dashboard under Storage.`;
    console.error(`[STORAGE] ❌ ${msg}`);
    return { ok: false, bucket: BUCKET, message: msg };
  }

  console.log(`[STORAGE] ✅ Bucket '${BUCKET}' created successfully`);
  bucketReady = true;
  return { ok: true, bucket: BUCKET, message: `Bucket '${BUCKET}' created` };
}

export async function uploadFile(file: File): Promise<FileMetadata> {
  console.log(`[STORAGE] Uploading file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Verify bucket exists (auto-creates if missing; cached after first call)
  const health = await ensureBucket();
  if (!health.ok) {
    throw new Error(`Storage unavailable: ${health.message}`);
  }

  const supabase = createServerClient();

  // Prefix with timestamp to avoid name collisions
  const storagePath = `${Date.now()}-${file.name}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    // Reset cache so next upload re-checks bucket health
    bucketReady = false;
    console.error(`[STORAGE] Upload error for ${file.name}:`, error.message);
    throw new Error(`Storage upload error: ${error.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);

  console.log(`[STORAGE] Successfully uploaded: ${file.name} → ${urlData.publicUrl}`);

  return {
    id: data.path,
    name: file.name,
    type: file.type || CONTENT_TYPE_MAP[file.name.split('.').pop()?.toLowerCase() || ''] || 'unknown',
    size: file.size,
    uploadedAt: new Date(),
    url: urlData.publicUrl,
  };
}

export async function uploadFiles(files: File[]): Promise<FileMetadata[]> {
  console.log(`[STORAGE] Starting batch upload of ${files.length} files`);
  const results = await Promise.all(files.map(file => uploadFile(file)));
  console.log(`[STORAGE] Batch upload completed: ${results.length} files`);
  return results;
}

export async function listFiles(): Promise<FileMetadata[]> {
  console.log('[STORAGE] Listing files from Supabase Storage...');

  const supabase = createServerClient();

  const { data, error } = await supabase.storage.from(BUCKET).list('', {
    limit: 1000,
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    console.error('[STORAGE] Error listing files:', error.message);
    return [];
  }

  if (!data) return [];

  const files: FileMetadata[] = data
    .filter(item => item.name !== '.emptyFolderPlaceholder')
    .map(item => {
      const extension = item.name.split('.').pop()?.toLowerCase() || '';
      // Strip the timestamp prefix added on upload to show the original filename
      const originalName = item.name.replace(/^\d+-/, '');
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(item.name);

      return {
        id: item.name,
        name: originalName,
        type: CONTENT_TYPE_MAP[extension] || 'unknown',
        size: (item.metadata as { size?: number } | null)?.size ?? 0,
        uploadedAt: item.created_at ? new Date(item.created_at) : new Date(),
        url: urlData.publicUrl,
      };
    });

  console.log(`[STORAGE] Found ${files.length} files`);
  return files;
}

export async function deleteFile(fileId: string): Promise<void> {
  console.log(`[STORAGE] Deleting file: ${fileId}`);

  const supabase = createServerClient();

  const { error } = await supabase.storage.from(BUCKET).remove([fileId]);

  if (error) {
    console.error(`[STORAGE] Delete error for ${fileId}:`, error.message);
    throw new Error(`Storage delete error: ${error.message}`);
  }

  console.log(`[STORAGE] Successfully deleted: ${fileId}`);
}

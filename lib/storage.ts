import { put, list, del } from '@vercel/blob';
import { FileMetadata } from '@/types';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadFile(file: File): Promise<FileMetadata> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Support both BLOB_READ_WRITE_TOKEN and Files_READ_WRITE_TOKEN
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.Files_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please add it to Vercel environment variables.');
  }

  // Log token info for debugging (first few chars only)
  console.log('Using blob token:', token.substring(0, 20) + '...');

  try {
    const blob = await put(file.name, file, {
      access: 'public',
      token: token,
    });
    return {
      id: blob.pathname,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date(),
      url: blob.url,
    };
  } catch (error) {
    console.error('Vercel Blob upload error:', error);
    if (error instanceof Error && error.message.includes('Access denied')) {
      throw new Error('Blob storage access denied. Please verify BLOB_READ_WRITE_TOKEN is correct in Vercel environment variables. Token should start with "vercel_blob_rw_".');
    }
    throw error;
  }
}

export async function uploadFiles(files: File[]): Promise<FileMetadata[]> {
  const uploadPromises = files.map(file => uploadFile(file));
  return Promise.all(uploadPromises);
}

export async function listFiles(): Promise<FileMetadata[]> {
  // Support multiple token names
  const token = process.env.BLOB_READ_WRITE_TOKEN 
    || process.env.Files_READ_WRITE_TOKEN
    || process.env.BLOB_TOKEN
    || process.env.VERCEL_BLOB_TOKEN;
  if (!token) {
    console.warn('BLOB_READ_WRITE_TOKEN not set, returning empty file list');
    return [];
  }

  const { blobs } = await list({
    token: token,
  });

  return blobs.map(blob => {
    // Extract file type from filename extension
    const filename = blob.pathname.split('/').pop() || 'unknown';
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    const contentTypeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
    };

    return {
      id: blob.pathname,
      name: filename,
      type: contentTypeMap[extension] || 'unknown',
      size: blob.size,
      uploadedAt: new Date(), // Use current date as fallback
      url: blob.url,
    };
  });
}

export async function deleteFile(fileId: string): Promise<void> {
  // Support multiple token names
  const token = process.env.BLOB_READ_WRITE_TOKEN 
    || process.env.Files_READ_WRITE_TOKEN
    || process.env.BLOB_TOKEN
    || process.env.VERCEL_BLOB_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set. Please add it to Vercel environment variables.');
  }

  await del(fileId, {
    token: token,
  });
}



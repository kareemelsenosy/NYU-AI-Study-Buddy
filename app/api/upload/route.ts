import { NextRequest } from 'next/server';
import { uploadFiles } from '@/lib/storage';
import { embedAndStoreFile } from '@/lib/embedder';
import { isValidFileType, formatFileSize } from '@/lib/utils';
import { UploadResponse } from '@/types';
import { createServerClient } from '@/lib/supabase';

// No per-request file count limit — users can upload any number of files.
// A hard ceiling of 100 is kept only to prevent accidental abuse; raise or remove as needed.
const MAX_FILES = 100;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per file

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Log incoming request
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[UPLOAD:${requestId}] ⬇️  INCOMING REQUEST`);
  console.log(`[UPLOAD:${requestId}] Method: POST`);
  console.log(`[UPLOAD:${requestId}] Path: /api/upload`);
  console.log(`[UPLOAD:${requestId}] Headers:`, {
    'content-type': req.headers.get('content-type'),
    'content-length': req.headers.get('content-length'),
    'user-agent': req.headers.get('user-agent')?.substring(0, 50) + '...',
  });
  console.log(`[UPLOAD:${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    console.log(`[UPLOAD:${requestId}] 📥 Parsing form data...`);
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const courseId = formData.get('courseId') as string | null;
    const userId = formData.get('userId') as string | null;

    // ── Auth check: verify that the caller owns this course ───────────────────
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' } as UploadResponse),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (courseId) {
      const serverSupabase = createServerClient();
      const { data: course } = await serverSupabase
        .from('courses')
        .select('professor_id')
        .eq('id', courseId)
        .single();

      if (!course) {
        return new Response(
          JSON.stringify({ success: false, error: 'Course not found' } as UploadResponse),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (course.professor_id !== userId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Not authorized for this course' } as UploadResponse),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Verify the user has role=professor in the users table
      const { data: userRow } = await serverSupabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      if (!userRow || userRow.role !== 'professor') {
        return new Response(
          JSON.stringify({ success: false, error: 'Only professors can upload files' } as UploadResponse),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`[UPLOAD:${requestId}] ✅ Form data parsed successfully`);
    console.log(`[UPLOAD:${requestId}] 📦 Files received: ${files.length}`);
    files.forEach((file, index) => {
      console.log(`[UPLOAD:${requestId}]   File ${index + 1}/${files.length}: ${file.name}`);
      console.log(`[UPLOAD:${requestId}]     - Size: ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`[UPLOAD:${requestId}]     - Type: ${file.type || 'unknown'}`);
    });

    if (files.length === 0) {
      const duration = Date.now() - startTime;
      console.error(`[UPLOAD:${requestId}] ❌ Error: No files provided (${duration}ms)`);
      console.log(`[UPLOAD:${requestId}] ⬆️  RESPONSE: 400 Bad Request\n`);
      return new Response(
        JSON.stringify({ success: false, error: 'No files provided' } as UploadResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (files.length > MAX_FILES) {
      const duration = Date.now() - startTime;
      console.error(`[UPLOAD:${requestId}] ❌ Error: Batch too large (${files.length} files, max ${MAX_FILES}) (${duration}ms)`);
      console.log(`[UPLOAD:${requestId}] ⬆️  RESPONSE: 400 Bad Request\n`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many files in one batch (${files.length}). Split into batches of ${MAX_FILES} or fewer.`,
        } as UploadResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate files
    const invalidFiles: string[] = [];
    const oversizedFiles: string[] = [];

    for (const file of files) {
      if (!isValidFileType(file.name)) {
        invalidFiles.push(file.name);
      }
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
      }
    }

    if (invalidFiles.length > 0) {
      const duration = Date.now() - startTime;
      console.error(`[UPLOAD:${requestId}] ❌ Error: Invalid file types: ${invalidFiles.join(', ')} (${duration}ms)`);
      console.log(`[UPLOAD:${requestId}] ⬆️  RESPONSE: 400 Bad Request\n`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid file types: ${invalidFiles.join(', ')}. Supported: PDF, PPTX, DOCX, XLSX, TXT`,
        } as UploadResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (oversizedFiles.length > 0) {
      const duration = Date.now() - startTime;
      console.error(`[UPLOAD:${requestId}] ❌ Error: Files too large: ${oversizedFiles.join(', ')} (${duration}ms)`);
      console.log(`[UPLOAD:${requestId}] ⬆️  RESPONSE: 400 Bad Request\n`);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Files too large: ${oversizedFiles.join(', ')}. Maximum size: ${formatFileSize(MAX_FILE_SIZE)}`,
        } as UploadResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Upload files
    console.log(`[UPLOAD:${requestId}] 🚀 Starting file upload to Supabase Storage...${courseId ? ` (course: ${courseId})` : ''}`);
    const uploadStart = Date.now();
    const uploadedFiles = await uploadFiles(files);
    const uploadDuration = Date.now() - uploadStart;
    
    console.log(`[UPLOAD:${requestId}] ✅ Successfully uploaded ${uploadedFiles.length} file(s) in ${uploadDuration}ms`);
    uploadedFiles.forEach((file, index) => {
      console.log(`[UPLOAD:${requestId}]   ✓ ${index + 1}/${uploadedFiles.length}: ${file.name} → ${file.url}`);
    });

    // Trigger RAG embedding in the background (non-blocking — response is sent immediately)
    if (courseId) {
      Promise.all(
        uploadedFiles.map(f =>
          embedAndStoreFile(f.id, f.name, f.url, courseId).then(result => {
            if (result.success) {
              console.log(`[UPLOAD:${requestId}] [EMBED] ✅ ${f.name}: ${result.chunks} chunks stored`);
            } else {
              console.warn(`[UPLOAD:${requestId}] [EMBED] ⚠️ ${f.name}: ${result.error}`);
            }
          }).catch(err => {
            console.error(`[UPLOAD:${requestId}] [EMBED] ❌ ${f.name}:`, err);
          })
        )
      ).catch(() => {});
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[UPLOAD:${requestId}] ⬆️  RESPONSE: 200 OK (${totalDuration}ms total)\n`);

    return new Response(
      JSON.stringify({ success: true, files: uploadedFiles } as UploadResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n[UPLOAD:${requestId}] ❌ ERROR after ${duration}ms`);
    console.error(`[UPLOAD:${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[UPLOAD:${requestId}] Error name:`, error instanceof Error ? error.name : 'Unknown');
    if (error instanceof Error && error.stack) {
      console.error(`[UPLOAD:${requestId}] Stack trace:`, error.stack);
    }
    console.error(`[UPLOAD:${requestId}] ⬆️  RESPONSE: 500 Internal Server Error\n`);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
      } as UploadResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}



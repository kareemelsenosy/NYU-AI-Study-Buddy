import { NextRequest } from 'next/server';
import { deleteFile } from '@/lib/storage';
import { deleteFileChunks } from '@/lib/embedder';
import { createServerClient } from '@/lib/supabase';
import { FileMetadata, FileListResponse } from '@/types';

/**
 * GET /api/files?courseId=X&userId=Y
 *
 * Returns files for a specific course, but only if the requesting user is the
 * professor who owns that course.  Students never need to call this endpoint
 * directly — they interact with the AI which reads embeddings, not raw files.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  const userId  = searchParams.get('userId');

  // Both params are required
  if (!courseId || !userId) {
    return new Response(
      JSON.stringify({ files: [], error: 'courseId and userId are required' } as FileListResponse),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createServerClient();

    // Verify the requesting user owns this course
    const { data: course } = await supabase
      .from('courses')
      .select('professor_id')
      .eq('id', courseId)
      .single();

    if (!course) {
      return new Response(
        JSON.stringify({ files: [], error: 'Course not found' } as FileListResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (course.professor_id !== userId) {
      return new Response(
        JSON.stringify({ files: [], error: 'Not authorized to view this course\'s files' } as FileListResponse),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch file metadata directly from the course_files table (no Storage list needed)
    const { data: courseFiles, error } = await supabase
      .from('course_files')
      .select('file_id, file_name, file_url, file_size, file_type, uploaded_at')
      .eq('course_id', courseId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('[FILES] Error fetching course files:', error.message);
      return new Response(
        JSON.stringify({ files: [], error: 'Failed to list files' } as FileListResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const files: FileMetadata[] = (courseFiles || []).map(f => ({
      id: f.file_id,
      name: f.file_name,
      type: f.file_type || 'unknown',
      size: f.file_size || 0,
      uploadedAt: new Date(f.uploaded_at),
      url: f.file_url || '',
    }));

    return new Response(
      JSON.stringify({ files } as FileListResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FILES] GET error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ files: [], error: 'Internal server error' } as FileListResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/files?id=X&userId=Y
 *
 * Deletes a file from storage, document_chunks, and course_files.
 * Requires the requesting user to be the professor who owns the course
 * this file belongs to.
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');
  const userId = searchParams.get('userId');

  if (!fileId || !userId) {
    return new Response(
      JSON.stringify({ error: 'id and userId are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabase = createServerClient();

    // Find which course this file belongs to
    const { data: courseFile } = await supabase
      .from('course_files')
      .select('course_id')
      .eq('file_id', fileId)
      .single();

    if (!courseFile) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user owns that course
    const { data: course } = await supabase
      .from('courses')
      .select('professor_id')
      .eq('id', courseFile.course_id)
      .single();

    if (!course || course.professor_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Not authorized to delete this file' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete from all three places in parallel
    await Promise.all([
      deleteFile(fileId),
      deleteFileChunks(fileId),
      supabase.from('course_files').delete().eq('file_id', fileId),
    ]);

    console.log(`[FILES] Deleted file ${fileId} from course ${courseFile.course_id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FILES] DELETE error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: 'Failed to delete file' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

import { NextRequest } from 'next/server';
import { listFiles, deleteFile } from '@/lib/storage';
import { FileListResponse } from '@/types';

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Log incoming request
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[FILES:${requestId}] ⬇️  INCOMING REQUEST`);
  console.log(`[FILES:${requestId}] Method: GET`);
  console.log(`[FILES:${requestId}] Path: /api/files`);
  console.log(`[FILES:${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const { searchParams } = new URL(req.url);
    const fileIdsParam = searchParams.get('fileIds');
    
    console.log(`[FILES:${requestId}] 📂 Listing files...${fileIdsParam ? ` (filtering by ${fileIdsParam.split(',').length} file IDs)` : ''}`);
    const allFiles = await listFiles();
    
    // If fileIds are provided, filter files
    let files = allFiles;
    if (fileIdsParam) {
      const fileIds = fileIdsParam.split(',').filter(id => id.trim());
      files = allFiles.filter(f => fileIds.includes(f.id));
      console.log(`[FILES:${requestId}] Filtered to ${files.length} file(s)`);
    }
    
    const duration = Date.now() - startTime;
    console.log(`[FILES:${requestId}] ✅ Successfully listed ${files.length} file(s) in ${duration}ms`);
    console.log(`[FILES:${requestId}] ⬆️  RESPONSE: 200 OK (${duration}ms)\n`);
    
    return new Response(
      JSON.stringify({ files } as FileListResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n[FILES:${requestId}] ❌ ERROR after ${duration}ms`);
    console.error(`[FILES:${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[FILES:${requestId}] Error name:`, error instanceof Error ? error.name : 'Unknown');
    if (error instanceof Error && error.stack) {
      console.error(`[FILES:${requestId}] Stack trace:`, error.stack);
    }
    console.error(`[FILES:${requestId}] ⬆️  RESPONSE: 500 Internal Server Error\n`);
    
    return new Response(
      JSON.stringify({ 
        files: [], 
        error: 'Failed to list files',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      } as FileListResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Log incoming request
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[FILES:${requestId}] ⬇️  INCOMING REQUEST`);
  console.log(`[FILES:${requestId}] Method: DELETE`);
  console.log(`[FILES:${requestId}] Path: /api/files`);
  console.log(`[FILES:${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('id');
    const fileUrl = searchParams.get('url');

    console.log(`[FILES:${requestId}] 🗑️  Delete request for file ID: ${fileId}${fileUrl ? `, URL: ${fileUrl}` : ''}`);

    if (!fileId) {
      const duration = Date.now() - startTime;
      console.error(`[FILES:${requestId}] ❌ Error: File ID is required (${duration}ms)`);
      console.log(`[FILES:${requestId}] ⬆️  RESPONSE: 400 Bad Request\n`);
      return new Response(
        JSON.stringify({ error: 'File ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FILES:${requestId}] 🚀 Deleting file...`);
    const deleteStart = Date.now();
    await deleteFile(fileId);
    const deleteDuration = Date.now() - deleteStart;
    const totalDuration = Date.now() - startTime;
    
    console.log(`[FILES:${requestId}] ✅ Successfully deleted file ${fileId} (${deleteDuration}ms)`);
    console.log(`[FILES:${requestId}] ⬆️  RESPONSE: 200 OK (${totalDuration}ms total)\n`);
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n[FILES:${requestId}] ❌ ERROR after ${duration}ms`);
    console.error(`[FILES:${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[FILES:${requestId}] Error name:`, error instanceof Error ? error.name : 'Unknown');
    if (error instanceof Error && error.stack) {
      console.error(`[FILES:${requestId}] Stack trace:`, error.stack);
    }
    console.error(`[FILES:${requestId}] ⬆️  RESPONSE: 500 Internal Server Error\n`);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to delete file',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}



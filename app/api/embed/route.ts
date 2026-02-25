import { NextRequest } from 'next/server';
import { embedAndStoreFile } from '@/lib/embedder';

export async function POST(req: NextRequest) {
  try {
    const { fileId, fileName, fileUrl, courseId } = await req.json();

    if (!fileId || !fileName || !fileUrl || !courseId) {
      return Response.json(
        { error: 'fileId, fileName, fileUrl, and courseId are all required' },
        { status: 400 },
      );
    }

    const result = await embedAndStoreFile(fileId, fileName, fileUrl, courseId);

    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 500 });
    }

    return Response.json({ success: true, chunks: result.chunks });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[EMBED API] Unhandled error:', message);
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

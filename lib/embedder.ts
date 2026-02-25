import { createServerClient } from '@/lib/supabase';
import { extractTextFromFile } from '@/lib/file-extractors';
import { chunkText } from '@/lib/chunker';
import { embedTexts } from '@/lib/embeddings';

export interface EmbedResult {
  success: boolean;
  chunks: number;
  error?: string;
}

/**
 * Fetch a course file, extract its text, chunk it, embed every chunk,
 * and upsert the results into the document_chunks table.
 *
 * Safe to call multiple times for the same file — old chunks are deleted first.
 */
export async function embedAndStoreFile(
  fileId: string,
  fileName: string,
  fileUrl: string,
  courseId: string,
): Promise<EmbedResult> {
  console.log(`[EMBEDDER] Starting: ${fileName} (course: ${courseId})`);

  try {
    // ── 1. Fetch the file from Supabase Storage ────────────────────────────
    const res = await fetch(fileUrl, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
    const buffer = Buffer.from(await res.arrayBuffer());

    // ── 2. Extract text ────────────────────────────────────────────────────
    const extracted = await extractTextFromFile(fileName, buffer);
    if (!extracted.text || extracted.error) {
      return { success: false, chunks: 0, error: extracted.error || 'No text extracted from file' };
    }
    console.log(`[EMBEDDER] Extracted ${extracted.text.length} chars from ${fileName}`);

    // ── 3. Chunk ───────────────────────────────────────────────────────────
    const chunks = chunkText(extracted.text);
    if (chunks.length === 0) {
      return { success: false, chunks: 0, error: 'No chunks produced (file may be empty or unsupported format)' };
    }
    console.log(`[EMBEDDER] Produced ${chunks.length} chunks`);

    // ── 4. Embed (batched) ─────────────────────────────────────────────────
    const embeddings = await embedTexts(chunks.map(c => c.content));
    console.log(`[EMBEDDER] Embedded ${embeddings.length} chunks`);

    // ── 5. Upsert into document_chunks ─────────────────────────────────────
    const supabase = createServerClient();

    // Delete stale chunks for this file first (idempotency)
    await supabase
      .from('document_chunks')
      .delete()
      .eq('file_id', fileId)
      .eq('course_id', courseId);

    // pgvector expects the embedding as a bracketed string: "[0.1,0.2,...]"
    const rows = chunks.map((chunk, i) => ({
      course_id:   courseId,
      file_id:     fileId,
      file_name:   fileName,
      chunk_index: chunk.chunkIndex,
      content:     chunk.content,
      token_count: chunk.tokenCount,
      embedding:   `[${embeddings[i].join(',')}]`,
    }));

    const { error: insertError } = await supabase.from('document_chunks').insert(rows);
    if (insertError) throw new Error(insertError.message);

    console.log(`[EMBEDDER] ✅ Stored ${rows.length} chunks for ${fileName}`);
    return { success: true, chunks: rows.length };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[EMBEDDER] ❌ Failed for ${fileName}:`, message);
    return { success: false, chunks: 0, error: message };
  }
}

/**
 * Delete all document_chunks that belong to a specific file.
 * Call this when a file is deleted from storage.
 */
export async function deleteFileChunks(fileId: string): Promise<void> {
  const supabase = createServerClient();
  await supabase.from('document_chunks').delete().eq('file_id', fileId);
  console.log(`[EMBEDDER] Deleted chunks for file: ${fileId}`);
}

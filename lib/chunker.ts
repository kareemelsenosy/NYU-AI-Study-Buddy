export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

// 1 token ≈ 4 characters (rough approximation for English text)
const CHARS_PER_TOKEN = 4;
const CHUNK_TOKENS = 800;   // ~800 tokens per chunk
const OVERLAP_TOKENS = 150; // ~150 token overlap between chunks

export function chunkText(text: string): TextChunk[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  const chunkSize = CHUNK_TOKENS * CHARS_PER_TOKEN;   // 3200 chars
  const overlap   = OVERLAP_TOKENS * CHARS_PER_TOKEN; // 600 chars
  const step      = chunkSize - overlap;               // 2600 chars

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < cleaned.length) {
    let end = Math.min(start + chunkSize, cleaned.length);

    // Snap end to a sentence boundary where possible
    if (end < cleaned.length) {
      const sentenceBoundary = cleaned.lastIndexOf('. ', end);
      if (sentenceBoundary > start + step * 0.5) {
        end = sentenceBoundary + 2;
      } else {
        const wordBoundary = cleaned.lastIndexOf(' ', end);
        if (wordBoundary > start) end = wordBoundary + 1;
      }
    }

    const content = cleaned.slice(start, end).trim();
    if (content.length > 50) {
      chunks.push({
        content,
        chunkIndex: index++,
        tokenCount: Math.ceil(content.length / CHARS_PER_TOKEN),
      });
    }

    start += step;
  }

  return chunks;
}

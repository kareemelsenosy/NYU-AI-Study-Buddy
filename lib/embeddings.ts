// Embedding model — defaults to OpenAI text-embedding-3-small via the NYU Portkey gateway.
// Override with EMBEDDING_MODEL env var if the gateway uses a different virtual-key prefix.
const DEFAULT_MODEL = '@gpt-4o/text-embedding-3-small';
const BATCH_SIZE = 100; // max inputs per single API call

/**
 * Embed an array of strings.
 * Returns one 1536-dimension vector per input, in the same order.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey  = process.env.PORTKEY_API_KEY;
  const baseURL = process.env.PORTKEY_BASE_URL || 'https://ai-gateway.apps.cloud.rt.nyu.edu/v1';
  const model   = process.env.EMBEDDING_MODEL  || DEFAULT_MODEL;

  if (!apiKey) throw new Error('PORTKEY_API_KEY is not set');
  if (texts.length === 0) return [];

  const all: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const res = await fetch(`${baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: batch }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Embeddings API error (${res.status}): ${errText.substring(0, 300)}`);
    }

    const json = await res.json();
    all.push(...(json.data as { embedding: number[] }[]).map(d => d.embedding));
  }

  return all;
}

/** Convenience wrapper — embed a single string. */
export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

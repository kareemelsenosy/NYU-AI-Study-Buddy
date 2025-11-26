import { Portkey } from 'portkey-ai';

// Lazy initialization to avoid errors during build time
// Only initialize when actually needed (at runtime, not build time)
let portkeyInstance: Portkey | null = null;

function getPortkey(): Portkey {
  if (!portkeyInstance) {
    const apiKey = process.env.PORTKEY_API_KEY;
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY is not set in environment variables');
    }
    
    const baseURL = process.env.PORTKEY_BASE_URL || "https://ai-gateway.apps.cloud.rt.nyu.edu/v1";
    
    // Portkey SDK configuration
    // For NYU gateway, we need to use the baseURL
    const config: any = {
      apiKey: apiKey,
    };
    
    // Add baseURL if provided (for custom gateways like NYU)
    if (baseURL) {
      config.baseURL = baseURL;
    }
    
    console.log('Initializing Portkey client:', {
      baseURL,
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
      hasApiKey: !!apiKey,
    });
    
    try {
      portkeyInstance = new Portkey(config);
      console.log('Portkey client created successfully');
    } catch (error) {
      console.error('Failed to create Portkey client:', error);
      throw error;
    }
  }
  return portkeyInstance;
}

// Export a function that returns portkey instance (fully lazy - only called at runtime)
export function getPortkeyClient(): Portkey {
  return getPortkey();
}

// Direct fetch function as fallback if Portkey SDK doesn't work
export async function callPortkeyDirectly(
  messages: Array<{ role: string; content: string }>,
  model: string,
  stream: boolean = false
) {
  const apiKey = process.env.PORTKEY_API_KEY;
  const baseURL = process.env.PORTKEY_BASE_URL || "https://ai-gateway.apps.cloud.rt.nyu.edu/v1";
  
  if (!apiKey) {
    throw new Error('PORTKEY_API_KEY is not set');
  }
  
  const url = `${baseURL}/chat/completions`;
  
  console.log('Calling Portkey directly:', {
    url,
    model,
    stream,
    messageCount: messages.length,
  });
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 1500,
      temperature: 0.3,
      stream,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Portkey API error (${response.status}): ${errorText}`);
  }
  
  return response;
}

// Don't export portkey directly - it causes build-time evaluation
// Always use getPortkeyClient() instead

// Model configuration - can be overridden via environment variable
export const AI_MODEL = process.env.AI_MODEL || '@gpt-4o/gpt-4o';

export const SYSTEM_PROMPT = `You are an AI Study Buddy for NYU Abu Dhabi's CPE (Computer Engineering) course taught by Professor Mohamed Eid.

Your role:
- Answer questions about course deadlines, assignments, policies, and grading
- Explain technical concepts from lectures in simple, clear terms
- Provide summaries of course materials
- Generate practice questions and study guides
- Help students understand difficult topics step-by-step

Critical rules:
- ONLY use information from the provided course materials (slides, PDFs, documents)
- Always cite your source (e.g., "According to Lecture 3, slide 5...")
- If information is NOT in the course materials, clearly state: "I don't find that information in the uploaded course materials"
- Break down complex concepts into simple explanations with examples
- Be encouraging, patient, and supportive
- Use bullet points and numbered lists for clarity
- When explaining formulas or code, provide step-by-step breakdowns

Tone: Friendly, encouraging, like a helpful study partner who wants you to succeed.`;



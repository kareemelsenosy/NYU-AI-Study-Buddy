// Dynamic import to avoid build-time errors
// Only import Portkey when actually needed at runtime
let PortkeyClass: any = null;
let portkeyInstance: any = null;

async function loadPortkeySDK() {
  if (!PortkeyClass) {
    try {
      const portkeyModule = await import('portkey-ai');
      PortkeyClass = portkeyModule.Portkey || portkeyModule.default;
      if (!PortkeyClass) {
        throw new Error('Portkey class not found in portkey-ai module');
      }
    } catch (error) {
      console.error('Failed to load portkey-ai module:', error);
      throw new Error(`Failed to load Portkey SDK: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return PortkeyClass;
}

async function getPortkey(): Promise<any> {
  if (!portkeyInstance) {
    const apiKey = process.env.PORTKEY_API_KEY;
    if (!apiKey) {
      throw new Error('PORTKEY_API_KEY is not set in environment variables');
    }
    
    // Use NYU gateway by default (matching Python example)
    const baseURL = process.env.PORTKEY_BASE_URL || "https://ai-gateway.apps.cloud.rt.nyu.edu/v1";
    
    // Load Portkey SDK dynamically
    const Portkey = await loadPortkeySDK();
    
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
      // Portkey SDK might try to validate connection during initialization
      // If it fails, we'll catch and provide better error message
      portkeyInstance = new Portkey(config);
      console.log('Portkey client created successfully');
    } catch (error: any) {
      console.error('Failed to create Portkey client:', error);
      
      // Check if it's a network/fetch error
      if (error?.message?.includes('fetch failed') || error?.cause?.code === 'UND_ERR_CONNECT') {
        throw new Error(
          `Cannot connect to NYU gateway (${baseURL}). ` +
          `This might mean: 1) Gateway requires VPN/network access, 2) Gateway URL is incorrect, ` +
          `3) Gateway is temporarily unavailable. Error: ${error.message || 'Network connection failed'}`
        );
      }
      
      // Check if it's an API key error
      if (error?.message?.includes('apiKey') || error?.message?.includes('API key')) {
        throw new Error(
          `Invalid Portkey API key. Please verify your PORTKEY_API_KEY in Vercel environment variables. ` +
          `Get your key from: https://app.portkey.ai/api-keys`
        );
      }
      
      throw error;
    }
  }
  return portkeyInstance;
}

// Export a function that returns portkey instance (fully lazy - only called at runtime)
// Now async to support dynamic import
export async function getPortkeyClient(): Promise<any> {
  return await getPortkey();
}

// Direct fetch function as fallback if Portkey SDK doesn't work
export async function callPortkeyDirectly(
  messages: Array<{ role: string; content: string }>,
  model: string,
  stream: boolean = false
) {
  const apiKey = process.env.PORTKEY_API_KEY;
  // Use NYU gateway (matching Python example)
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



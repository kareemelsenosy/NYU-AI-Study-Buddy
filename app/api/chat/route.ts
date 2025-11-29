import { NextRequest } from 'next/server';
import { getPortkeyClient, SYSTEM_PROMPT, AI_MODEL, callPortkeyDirectly } from '@/lib/portkey';
import { listFiles } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/file-extractors';
import { ChatRequest, Message } from '@/types';

const MAX_CONTEXT_LENGTH = 100000; // Limit context to avoid token limits

async function loadCourseMaterials(): Promise<string> {
  console.log('[MATERIALS] Loading course materials...');
  const startTime = Date.now();
  
  try {
    const files = await listFiles();
    console.log(`[MATERIALS] Found ${files.length} files in storage`);
    
    if (files.length === 0) {
      console.log('[MATERIALS] No files found, returning empty message');
      return 'No course materials uploaded yet.';
    }

    const materialTexts: string[] = [];
    const maxFilesToProcess = 10; // Limit to prevent timeout

    // Process files in parallel with limit
    const filesToProcess = files.slice(0, maxFilesToProcess);
    console.log(`[MATERIALS] Processing ${filesToProcess.length} files...`);
    
    const extractionPromises = filesToProcess.map(async (file, index) => {
      try {
        console.log(`[MATERIALS] Processing file ${index + 1}/${filesToProcess.length}: ${file.name}`);
        const fetchStart = Date.now();
        
        const response = await fetch(file.url, { 
          signal: AbortSignal.timeout(30000) // 30 second timeout per file
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const buffer = Buffer.from(await response.arrayBuffer());
        const fetchDuration = Date.now() - fetchStart;
        console.log(`[MATERIALS] Fetched ${file.name} (${buffer.length} bytes) in ${fetchDuration}ms`);
        
        const extractStart = Date.now();
        const extracted = await extractTextFromFile(file.name, buffer);
        const extractDuration = Date.now() - extractStart;
        
        if (extracted.text && !extracted.error) {
          console.log(`[MATERIALS] Extracted ${extracted.text.length} characters from ${file.name} in ${extractDuration}ms`);
          return `\n\n=== ${file.name} ===\n${extracted.text}`;
        } else {
          console.warn(`[MATERIALS] Extraction failed for ${file.name}:`, extracted.error);
          return null;
        }
      } catch (error) {
        console.error(`[MATERIALS] Error processing file ${file.name}:`, error);
        console.error(`[MATERIALS] Error details:`, {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        });
        return null;
      }
    });

    const results = await Promise.all(extractionPromises);
    materialTexts.push(...results.filter((r): r is string => r !== null));
    
    const totalDuration = Date.now() - startTime;
    const totalText = materialTexts.join('\n');
    console.log(`[MATERIALS] Loaded ${materialTexts.length} files, ${totalText.length} total characters in ${totalDuration}ms`);

    return totalText;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[MATERIALS] Error loading course materials after ${duration}ms:`, error);
    console.error('[MATERIALS] Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return 'Error loading course materials.';
  }
}

function findRelevantSections(question: string, fullContext: string, maxLength: number = MAX_CONTEXT_LENGTH): string {
  const questionLower = question.toLowerCase();
  const keywords = questionLower.split(/\s+/).filter(k => k.length > 2);
  
  if (keywords.length === 0) {
    return fullContext.substring(0, maxLength);
  }

  const sections = fullContext.split(/=== /);
  const relevantSections: Array<{ score: number; text: string }> = [];

  for (const section of sections) {
    const sectionLower = section.toLowerCase();
    const relevanceScore = keywords.reduce((score, keyword) => {
      return score + (sectionLower.includes(keyword) ? 1 : 0);
    }, 0);

    if (relevanceScore > 0) {
      relevantSections.push({ score: relevanceScore, text: section });
    }
  }

  relevantSections.sort((a, b) => b.score - a.score);

  let result = '';
  for (const { text } of relevantSections) {
    if (result.length + text.length < maxLength) {
      result += '=== ' + text;
    } else {
      break;
    }
  }

  return result || fullContext.substring(0, maxLength);
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  // Log incoming request
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[CHAT:${requestId}] ⬇️  INCOMING REQUEST`);
  console.log(`[CHAT:${requestId}] Method: POST`);
  console.log(`[CHAT:${requestId}] Path: /api/chat`);
  console.log(`[CHAT:${requestId}] Headers:`, {
    'content-type': req.headers.get('content-type'),
    'content-length': req.headers.get('content-length'),
    'user-agent': req.headers.get('user-agent')?.substring(0, 50) + '...',
  });
  console.log(`[CHAT:${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    console.log(`[CHAT:${requestId}] 📥 Parsing request body...`);
    const body: ChatRequest = await req.json();
    const { message, conversationHistory = [] } = body;

    console.log(`[CHAT:${requestId}] ✅ Request body parsed`);
    console.log(`[CHAT:${requestId}] 📝 Message: "${message?.substring(0, 100)}${message && message.length > 100 ? '...' : ''}"`);
    console.log(`[CHAT:${requestId}] 📊 Message length: ${message?.length || 0} chars`);
    console.log(`[CHAT:${requestId}] 💬 Conversation history: ${conversationHistory.length} messages`);

    if (!message || message.trim().length === 0) {
      const duration = Date.now() - startTime;
      console.error(`[CHAT:${requestId}] ❌ Error: Empty message (${duration}ms)`);
      console.log(`[CHAT:${requestId}] ⬆️  RESPONSE: 400 Bad Request\n`);
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load course materials
    console.log(`[CHAT:${requestId}] 📚 Loading course materials...`);
    const materialsStart = Date.now();
    const allMaterials = await loadCourseMaterials();
    const materialsDuration = Date.now() - materialsStart;
    console.log(`[CHAT:${requestId}] ✅ Course materials loaded: ${allMaterials.length} characters (${materialsDuration}ms)`);
    
    console.log(`[CHAT:${requestId}] 🔍 Finding relevant sections...`);
    const contextStart = Date.now();
    const context = findRelevantSections(message, allMaterials);
    const contextDuration = Date.now() - contextStart;
    console.log(`[CHAT:${requestId}] ✅ Relevant context selected: ${context.length} characters (${contextDuration}ms)`);

    // Build messages array
    console.log(`[CHAT:${requestId}] 📋 Building messages array...`);
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-10);
    console.log(`[CHAT:${requestId}] 📜 Adding ${recentHistory.length} messages from history`);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current question with context
    const userMessageContent = `Course Materials:\n${context}\n\nStudent Question: ${message}`;
    messages.push({
      role: 'user',
      content: userMessageContent,
    });
    
    console.log(`[CHAT:${requestId}] ✅ Messages array built: ${messages.length} total messages`);
    console.log(`[CHAT:${requestId}] 📊 Total message content length: ${userMessageContent.length} chars`);

    // Create streaming response
    console.log(`[CHAT:${requestId}] 🌊 Creating streaming response...`);
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`[CHAT:${requestId}] 🤖 Initializing Portkey client...`);
          console.log(`[CHAT:${requestId}]   Model: ${AI_MODEL}`);
          console.log(`[CHAT:${requestId}]   Base URL: ${process.env.PORTKEY_BASE_URL || 'default'}`);
          console.log(`[CHAT:${requestId}]   API Key: ${process.env.PORTKEY_API_KEY ? '✓ Set' : '✗ Missing'}`);
          
          let response: any;
          
          try {
            // Try using Portkey SDK first
            console.log(`[CHAT:${requestId}] 🔌 Attempting Portkey SDK connection...`);
            const sdkStart = Date.now();
            const portkey = await getPortkeyClient();
            const sdkInitDuration = Date.now() - sdkStart;
            console.log(`[CHAT:${requestId}] ✅ Portkey client initialized (${sdkInitDuration}ms)`);
            console.log(`[CHAT:${requestId}] 📡 Making API call via SDK...`);
            
            const apiStart = Date.now();
            response = await portkey.chat.completions.create({
              model: AI_MODEL,
              messages: messages as any,
              max_tokens: 1500,
              temperature: 0.3,
              stream: true,
            });
            const apiDuration = Date.now() - apiStart;
            
            console.log(`[CHAT:${requestId}] ✅ Portkey SDK call successful (${apiDuration}ms)`);
            console.log(`[CHAT:${requestId}] 🌊 Starting stream...`);
          } catch (sdkError: any) {
            // If SDK fails, try direct fetch as fallback
            console.error(`[CHAT:${requestId}] ⚠️  Portkey SDK error:`, sdkError?.message || 'Unknown error');
            console.error(`[CHAT:${requestId}] SDK error details:`, {
              message: sdkError?.message,
              status: sdkError?.status,
              cause: sdkError?.cause?.code || sdkError?.cause?.message,
              stack: sdkError?.stack?.substring(0, 500),
            });
            
            // Check if it's a network/connectivity error
            const isNetworkError = 
              sdkError?.message?.includes('fetch failed') || 
              sdkError?.message?.includes('Cannot connect') ||
              sdkError?.message?.includes('instantiate') ||
              sdkError?.message?.includes('ECONNREFUSED') ||
              sdkError?.message?.includes('ENOTFOUND') ||
              sdkError?.message?.includes('timeout') ||
              sdkError?.cause?.code === 'UND_ERR_CONNECT' ||
              sdkError?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' ||
              sdkError?.status === 404 || 
              sdkError?.message?.includes('not found');
            
            if (isNetworkError) {
              console.log(`[CHAT:${requestId}] 🔄 Network error detected, trying direct fetch fallback...`);
              console.log(`[CHAT:${requestId}] Error type: ${sdkError?.cause?.code || 'unknown'}`);
              console.log(`[CHAT:${requestId}] This might indicate NYU gateway is not accessible from Vercel`);
              
              const apiKey = process.env.PORTKEY_API_KEY;
              // Use NYU gateway (matching Python example)
              const baseURL = process.env.PORTKEY_BASE_URL || "https://ai-gateway.apps.cloud.rt.nyu.edu/v1";
              const url = `${baseURL}/chat/completions`;
              
              console.log(`[CHAT:${requestId}] 🔗 Direct fetch URL: ${url}`);
              console.log(`[CHAT:${requestId}] 🔑 API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'MISSING'}`);
              console.log(`[CHAT:${requestId}] 🌍 Environment: ${process.env.VERCEL ? 'Vercel' : 'Local'}`);
              console.log(`[CHAT:${requestId}] 📍 Region: ${process.env.VERCEL_REGION || 'unknown'}`);
              
              const fetchStart = Date.now();
              
              // Add timeout and better error handling for Vercel
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
              
              try {
                const fetchResponse = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                  },
                  body: JSON.stringify({
                    model: AI_MODEL,
                    messages: messages,
                    max_tokens: 1500,
                    temperature: 0.3,
                    stream: true,
                  }),
                  signal: controller.signal,
                });
                
                clearTimeout(timeoutId);
              
                const fetchDuration = Date.now() - fetchStart;
                
                if (!fetchResponse.ok) {
                  const errorText = await fetchResponse.text();
                  console.error(`[CHAT:${requestId}] ❌ Direct fetch failed: ${fetchResponse.status} (${fetchDuration}ms)`);
                  console.error(`[CHAT:${requestId}] Error response: ${errorText.substring(0, 500)}`);
                  throw new Error(`Direct fetch failed (${fetchResponse.status}): ${errorText.substring(0, 200)}`);
                }
                
                if (!fetchResponse.body) {
                  console.error(`[CHAT:${requestId}] ❌ No response body from direct fetch`);
                  throw new Error('No response body from direct fetch');
                }
                
                console.log(`[CHAT:${requestId}] ✅ Direct fetch successful (${fetchDuration}ms)`);
                console.log(`[CHAT:${requestId}] 🌊 Converting to stream...`);
              
              // Convert fetch response to async iterator compatible with Portkey SDK format
              const reader = fetchResponse.body.getReader();
              const decoder = new TextDecoder();
              let chunkCount = 0;
              
              response = {
                async *[Symbol.asyncIterator]() {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    chunkCount++;
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                      if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
                        try {
                          const jsonStr = line.slice(6).trim();
                          if (jsonStr && jsonStr !== '[DONE]') {
                            const data = JSON.parse(jsonStr);
                            yield { 
                              choices: [{ 
                                delta: { 
                                  content: data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content || '' 
                                } 
                              }] 
                            };
                          }
                        } catch (e) {
                          // Skip invalid JSON lines
                        }
                      }
                    }
                  }
                }
              };
              
                console.log(`[CHAT:${requestId}] ✅ Stream converter ready`);
              } catch (fetchError: any) {
                clearTimeout(timeoutId);
                const fetchDuration = Date.now() - fetchStart;
                
                console.error(`[CHAT:${requestId}] ❌ Direct fetch error after ${fetchDuration}ms:`, fetchError?.message || 'Unknown');
                console.error(`[CHAT:${requestId}] Fetch error details:`, {
                  name: fetchError?.name,
                  message: fetchError?.message,
                  cause: fetchError?.cause?.code || fetchError?.cause?.message,
                  stack: fetchError?.stack?.substring(0, 500),
                });
                
                // Check if it's a network connectivity issue
                if (fetchError?.name === 'AbortError' || fetchError?.message?.includes('timeout')) {
                  throw new Error(
                    `Connection timeout to NYU gateway. This usually means:\n` +
                    `1. NYU gateway requires VPN/network access\n` +
                    `2. Vercel IPs are not whitelisted\n` +
                    `3. Gateway is temporarily unavailable\n\n` +
                    `Solution: Contact NYU IT to whitelist Vercel IPs or use Portkey Cloud instead.`
                  );
                }
                
                if (fetchError?.message?.includes('fetch failed') || 
                    fetchError?.cause?.code === 'UND_ERR_CONNECT' ||
                    fetchError?.cause?.code === 'ENOTFOUND') {
                  throw new Error(
                    `Cannot connect to NYU gateway from Vercel. This usually means:\n` +
                    `1. NYU gateway is not accessible from Vercel's network\n` +
                    `2. Gateway requires VPN or specific IP whitelisting\n` +
                    `3. DNS resolution failed\n\n` +
                    `Solution: Use Portkey Cloud (https://api.portkey.ai/v1) or contact NYU IT.`
                  );
                }
                
                throw fetchError;
              }
            } else {
              // Not a network error, throw original SDK error
              throw sdkError;
            }
          }
          
          let hasContent = false;
          let totalContentLength = 0;
          let chunkCount = 0;

          console.log(`[CHAT:${requestId}] 📥 Reading stream chunks...`);
          const streamStart = Date.now();
          
          for await (const chunk of response) {
            chunkCount++;
            const content = chunk.choices?.[0]?.delta?.content || '';
            if (content) {
              hasContent = true;
              totalContentLength += content.length;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          
          const streamDuration = Date.now() - streamStart;
          console.log(`[CHAT:${requestId}] ✅ Stream completed: ${chunkCount} chunks, ${totalContentLength} chars (${streamDuration}ms)`);

          if (!hasContent) {
            console.warn(`[CHAT:${requestId}] ⚠️  No content received from Portkey API`);
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ error: 'No response from AI. Please check your Portkey configuration and try again.' })}\n\n`)
            );
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
          
          const totalDuration = Date.now() - startTime;
          console.log(`[CHAT:${requestId}] ⬆️  RESPONSE: 200 OK (Stream) (${totalDuration}ms total)`);
          console.log(`[CHAT:${requestId}] 📊 Summary: ${totalContentLength} chars, ${chunkCount} chunks\n`);
        } catch (error) {
          const duration = Date.now() - startTime;
          console.error(`\n[CHAT:${requestId}] ❌ ERROR in stream handler (${duration}ms)`);
          console.error(`[CHAT:${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
          console.error(`[CHAT:${requestId}] Error name:`, error instanceof Error ? error.name : 'Unknown');
          if (error instanceof Error && error.stack) {
            console.error(`[CHAT:${requestId}] Stack trace:`, error.stack);
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ 
              error: `AI Error: ${errorMessage}. Please check your Portkey API key and configuration.` 
            })}\n\n`)
          );
          controller.close();
          console.log(`[CHAT:${requestId}] ⬆️  RESPONSE: Error stream sent\n`);
        }
      },
    });

    console.log(`[CHAT:${requestId}] ✅ Streaming response initialized and returned`);
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n[CHAT:${requestId}] ❌ ERROR after ${duration}ms`);
    console.error(`[CHAT:${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    console.error(`[CHAT:${requestId}] Error name:`, error instanceof Error ? error.name : 'Unknown');
    if (error instanceof Error && error.stack) {
      console.error(`[CHAT:${requestId}] Stack trace:`, error.stack);
    }
    console.error(`[CHAT:${requestId}] ⬆️  RESPONSE: 500 Internal Server Error\n`);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}



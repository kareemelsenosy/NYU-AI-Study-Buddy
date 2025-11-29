import { NextRequest } from 'next/server';
import { getPortkeyClient, SYSTEM_PROMPT, AI_MODEL, callPortkeyDirectly } from '@/lib/portkey';
import { listFiles } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/file-extractors';
import { ChatRequest, Message } from '@/types';

const MAX_CONTEXT_LENGTH = 100000; // Limit context to avoid token limits

async function loadCourseMaterials(): Promise<string> {
  try {
    const files = await listFiles();
    if (files.length === 0) {
      return 'No course materials uploaded yet.';
    }

    const materialTexts: string[] = [];
    const maxFilesToProcess = 10; // Limit to prevent timeout

    // Process files in parallel with limit
    const filesToProcess = files.slice(0, maxFilesToProcess);
    const extractionPromises = filesToProcess.map(async (file) => {
      try {
        const response = await fetch(file.url, { 
          signal: AbortSignal.timeout(30000) // 30 second timeout per file
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        const extracted = await extractTextFromFile(file.name, buffer);

        if (extracted.text && !extracted.error) {
          return `\n\n=== ${file.name} ===\n${extracted.text}`;
        }
        return null;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        return null;
      }
    });

    const results = await Promise.all(extractionPromises);
    materialTexts.push(...results.filter((r): r is string => r !== null));

    return materialTexts.join('\n');
  } catch (error) {
    console.error('Error loading course materials:', error);
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
  try {
    const body: ChatRequest = await req.json();
    const { message, conversationHistory = [] } = body;

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load course materials
    const allMaterials = await loadCourseMaterials();
    const context = findRelevantSections(message, allMaterials);

    // Build messages array
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add conversation history (last 10 messages to avoid token limits)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current question with context
    messages.push({
      role: 'user',
      content: `Course Materials:\n${context}\n\nStudent Question: ${message}`,
    });

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Initializing Portkey client...');
          console.log('AI_MODEL:', AI_MODEL);
          console.log('PORTKEY_BASE_URL:', process.env.PORTKEY_BASE_URL);
          console.log('PORTKEY_API_KEY exists:', !!process.env.PORTKEY_API_KEY);
          
          let response: any;
          
          try {
            // Try using Portkey SDK first
            const portkey = await getPortkeyClient();
            console.log('Portkey client initialized, making API call via SDK...');
            
            response = await portkey.chat.completions.create({
              model: AI_MODEL,
              messages: messages as any,
              max_tokens: 1500,
              temperature: 0.3,
              stream: true,
            });
            
            console.log('Portkey SDK call successful, starting stream...');
          } catch (sdkError: any) {
            // If SDK fails, try direct fetch as fallback
            console.error('Portkey SDK error:', sdkError);
            console.error('SDK error details:', {
              message: sdkError?.message,
              cause: sdkError?.cause,
              stack: sdkError?.stack,
            });
            
            // Try direct fetch for any SDK error (not just 404)
            // This bypasses the SDK initialization issues
            if (sdkError?.message?.includes('fetch failed') || 
                sdkError?.message?.includes('Cannot connect') ||
                sdkError?.message?.includes('instantiate') ||
                sdkError?.cause?.code === 'UND_ERR_CONNECT' ||
                sdkError?.status === 404 || 
                sdkError?.message?.includes('not found')) {
              console.log('Portkey SDK returned 404, trying direct fetch to NYU gateway...');
              
              const apiKey = process.env.PORTKEY_API_KEY;
              // Use NYU gateway (matching Python example)
              const baseURL = process.env.PORTKEY_BASE_URL || "https://ai-gateway.apps.cloud.rt.nyu.edu/v1";
              const url = `${baseURL}/chat/completions`;
              
              console.log('Direct fetch URL:', url);
              
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
              });
              
              if (!fetchResponse.ok) {
                const errorText = await fetchResponse.text();
                throw new Error(`Direct fetch failed (${fetchResponse.status}): ${errorText}`);
              }
              
              if (!fetchResponse.body) {
                throw new Error('No response body from direct fetch');
              }
              
              // Convert fetch response to async iterator compatible with Portkey SDK format
              const reader = fetchResponse.body.getReader();
              const decoder = new TextDecoder();
              
              response = {
                async *[Symbol.asyncIterator]() {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
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
              
              console.log('Direct fetch successful, using streaming response');
            } else {
              throw sdkError;
            }
          }
          
          let hasContent = false;

          for await (const chunk of response) {
            const content = chunk.choices?.[0]?.delta?.content || '';
            if (content) {
              hasContent = true;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          if (!hasContent) {
            console.warn('No content received from Portkey API');
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ error: 'No response from AI. Please check your Portkey configuration and try again.' })}\n\n`)
            );
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Portkey API error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const errorDetails = error instanceof Error ? error.stack : String(error);
          console.error('Error details:', errorDetails);
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ 
              error: `AI Error: ${errorMessage}. Please check your Portkey API key and configuration.` 
            })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}



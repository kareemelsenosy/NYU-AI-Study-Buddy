import { NextRequest } from 'next/server';
import { getPortkeyClient, SYSTEM_PROMPT, AI_MODEL } from '@/lib/portkey';
import { listFiles } from '@/lib/storage';
import { extractTextFromFile } from '@/lib/file-extractors';
import { embedText } from '@/lib/embeddings';
import { createServerClient } from '@/lib/supabase';
import { trackQuestion } from '@/lib/analytics';
import { ChatRequest, Message } from '@/types';

const MAX_CONTEXT_LENGTH = 200000;
const RAG_CHUNK_COUNT = 8; // top-K chunks to retrieve

async function loadCourseMaterials(fileIds?: string[]): Promise<{ text: string; fileCount: number; fileNames: string[] }> {
  console.log('[MATERIALS] Loading course materials...', fileIds ? `(${fileIds.length} specific files)` : '(all files)');
  const startTime = Date.now();
  
  try {
    let files = await listFiles();
    console.log(`[MATERIALS] Found ${files.length} files in storage`);
    
    // Filter files by fileIds if provided
    if (fileIds && fileIds.length > 0) {
      files = files.filter(f => fileIds.includes(f.id));
      console.log(`[MATERIALS] Filtered to ${files.length} file(s) for course`);
    }
    
    if (files.length === 0) {
      console.log('[MATERIALS] No files found, returning empty message');
      return { text: 'No course materials uploaded yet.', fileCount: 0, fileNames: [] };
    }

    const materialTexts: string[] = [];
    const successfulFiles: string[] = [];
    const failedFiles: string[] = [];

    // Process ALL files - no limit
    console.log(`[MATERIALS] Processing ALL ${files.length} files...`);
    
    const extractionPromises = files.map(async (file, index) => {
      try {
        console.log(`[MATERIALS] Processing file ${index + 1}/${files.length}: ${file.name}`);
        const fetchStart = Date.now();
        
        const response = await fetch(file.url, { 
          signal: AbortSignal.timeout(45000) // Increased timeout
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
          console.log(`[MATERIALS] ✅ Extracted ${extracted.text.length} chars from ${file.name} in ${extractDuration}ms`);
          successfulFiles.push(file.name);
          return { name: file.name, text: extracted.text };
        } else {
          console.warn(`[MATERIALS] ⚠️ Extraction failed for ${file.name}:`, extracted.error);
          failedFiles.push(file.name);
          return null;
        }
      } catch (error) {
        console.error(`[MATERIALS] ❌ Error processing file ${file.name}:`, error);
        failedFiles.push(file.name);
        return null;
      }
    });

    const results = await Promise.all(extractionPromises);
    
    // Build the text with clear file separators
    for (const result of results) {
      if (result) {
        materialTexts.push(`\n\n${'='.repeat(50)}\n=== FILE: ${result.name} ===\n${'='.repeat(50)}\n${result.text}`);
      }
    }
    
    const totalDuration = Date.now() - startTime;
    const totalText = materialTexts.join('\n');
    
    console.log(`[MATERIALS] ========== SUMMARY ==========`);
    console.log(`[MATERIALS] Total files found: ${files.length}`);
    console.log(`[MATERIALS] Successfully processed: ${successfulFiles.length}`);
    console.log(`[MATERIALS] Failed to process: ${failedFiles.length}`);
    console.log(`[MATERIALS] Total text length: ${totalText.length} characters`);
    console.log(`[MATERIALS] Processing time: ${totalDuration}ms`);
    console.log(`[MATERIALS] Files included: ${successfulFiles.join(', ')}`);
    if (failedFiles.length > 0) {
      console.log(`[MATERIALS] Files failed: ${failedFiles.join(', ')}`);
    }
    console.log(`[MATERIALS] ================================`);

    return { text: totalText, fileCount: successfulFiles.length, fileNames: successfulFiles };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[MATERIALS] Error loading course materials after ${duration}ms:`, error);
    return { text: 'Error loading course materials.', fileCount: 0, fileNames: [] };
  }
}

function selectRelevantContent(question: string, fullContext: string, fileNames: string[], maxLength: number = MAX_CONTEXT_LENGTH): string {
  // If content fits, return all of it
  if (!fullContext || fullContext.length === 0) {
    return fullContext;
  }

  // IMPORTANT: If content is within limit, include ALL of it
  if (fullContext.length <= maxLength) {
    console.log(`[CONTEXT] Content (${fullContext.length} chars) fits within limit (${maxLength}). Including ALL content.`);
    return fullContext;
  }

  console.log(`[CONTEXT] Content (${fullContext.length} chars) exceeds limit (${maxLength}). Selecting most relevant sections...`);

  const questionLower = question.toLowerCase();
  const keywords = questionLower
    .split(/\s+/)
    .filter(k => k.length >= 2)
    .map(k => k.replace(/[^\w]/g, ''))
    .filter(k => k.length >= 2);
  
  // Check if question mentions specific files
  const fileNamesInQuestion: string[] = [];
  for (const fileName of fileNames) {
    const fileNameLower = fileName.toLowerCase().replace(/[^\w]/g, '');
    const fileNameWords = fileName.toLowerCase().split(/[\s_.-]+/);
    
    // Check if any part of filename is mentioned
    for (const word of fileNameWords) {
      if (word.length > 3 && questionLower.includes(word)) {
        fileNamesInQuestion.push(fileName);
        break;
      }
    }
    
    // Also check direct filename reference
    if (questionLower.includes(fileNameLower)) {
      if (!fileNamesInQuestion.includes(fileName)) {
        fileNamesInQuestion.push(fileName);
      }
    }
  }
  
  console.log(`[CONTEXT] Keywords: ${keywords.join(', ')}`);
  console.log(`[CONTEXT] Files mentioned in question: ${fileNamesInQuestion.join(', ') || 'none'}`);

  // Split into file sections
  const sections = fullContext.split(/={50,}\n=== FILE: /);
  const allSections: Array<{ score: number; text: string; filename: string; size: number }> = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (!section || section.trim().length === 0) continue;
    
    // Extract filename from section
    const filenameMatch = section.match(/^([^\n=]+)/);
    const filename = filenameMatch ? filenameMatch[1].trim().replace(' ===', '') : `Section ${i}`;
    const filenameLower = filename.toLowerCase();
    
    const sectionLower = section.toLowerCase();
    let relevanceScore = 0;
    
    // Highest priority: file explicitly mentioned in question
    if (fileNamesInQuestion.some(f => f.toLowerCase() === filenameLower)) {
      relevanceScore += 1000;
      console.log(`[CONTEXT] +1000 for "${filename}" - explicitly mentioned`);
    }
    
    // High priority: filename contains keywords
    for (const keyword of keywords) {
      if (filenameLower.includes(keyword)) {
        relevanceScore += 50;
      }
    }
    
    // Medium priority: content contains keywords
    for (const keyword of keywords) {
      const count = (sectionLower.match(new RegExp(keyword, 'g')) || []).length;
      relevanceScore += Math.min(count * 2, 30); // Cap at 30 per keyword
    }
    
    // Small base score for all files to ensure some representation
    relevanceScore += 1;
    
    allSections.push({ 
      score: relevanceScore, 
      text: i === 0 ? section : `${'='.repeat(50)}\n=== FILE: ${section}`,
      filename, 
      size: section.length 
    });
  }

  // Sort by relevance
  allSections.sort((a, b) => b.score - a.score);

  console.log(`[CONTEXT] Section scores:`);
  for (const s of allSections) {
    console.log(`[CONTEXT]   - ${s.filename}: score=${s.score}, size=${s.size}`);
  }

  // Build result, prioritizing high-scoring sections
  let result = '';
  const includedFiles: string[] = [];
  
  for (const { text, filename, score } of allSections) {
    if (result.length + text.length <= maxLength) {
      result += text;
      includedFiles.push(filename);
    } else if (score >= 100) {
      // Always try to include high-priority files even if truncated
      const remaining = maxLength - result.length;
      if (remaining > 1000) {
        result += text.substring(0, remaining);
        includedFiles.push(`${filename} (truncated)`);
      }
      break;
    } else {
      break;
    }
  }

  console.log(`[CONTEXT] Final result: ${result.length} chars, files included: ${includedFiles.join(', ')}`);

  if (result.length === 0) {
    return fullContext.substring(0, maxLength);
  }

  return result;
}

// ── RAG: semantic retrieval via pgvector ──────────────────────────────────────
async function loadCourseMaterialsRAG(
  question: string,
  courseId: string,
): Promise<{ text: string; fileCount: number; fileNames: string[]; chunkCount: number } | null> {
  try {
    const supabase = createServerClient();

    // Check whether any chunks have been embedded for this course
    const { count } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (!count || count === 0) {
      console.log('[RAG] No chunks found for course, falling back to full-text search');
      return null;
    }

    // Embed the question and run a cosine similarity search
    const questionEmbedding = await embedText(question);
    const embeddingStr = `[${questionEmbedding.join(',')}]`;

    const { data: chunks, error } = await supabase.rpc('match_documents', {
      query_embedding: embeddingStr,
      match_course_id: courseId,
      match_count: RAG_CHUNK_COUNT,
    });

    if (error || !chunks || chunks.length === 0) {
      console.warn('[RAG] match_documents returned no results:', error?.message);
      return null;
    }

    console.log(`[RAG] Retrieved ${chunks.length} relevant chunks`);

    const fileNames = [...new Set(chunks.map((c: { file_name: string }) => c.file_name))];
    const contextText = (chunks as { file_name: string; chunk_index: number; content: string }[])
      .map(c => `[Source: ${c.file_name}, section ${c.chunk_index + 1}]\n${c.content}`)
      .join('\n\n---\n\n');

    return {
      text: contextText,
      fileCount: fileNames.length,
      fileNames: fileNames as string[],
      chunkCount: chunks.length,
    };
  } catch (err) {
    console.warn('[RAG] Retrieval failed, falling back to full-text search:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[CHAT:${requestId}] ⬇️  INCOMING REQUEST`);
  console.log(`[CHAT:${requestId}] Timestamp: ${new Date().toISOString()}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    const body: ChatRequest = await req.json();
    const { message, conversationHistory = [], model: requestedModel, user, courseId, fileIds, sessionId } = body;

    const modelToUse = requestedModel || AI_MODEL;

    console.log(`[CHAT:${requestId}] 📝 Message: "${message?.substring(0, 100)}..."`);
    console.log(`[CHAT:${requestId}] 💬 History: ${conversationHistory.length} messages`);
    console.log(`[CHAT:${requestId}] 🤖 Model: ${modelToUse}`);
    console.log(`[CHAT:${requestId}] 👤 User: ${user?.name || 'Guest'}`);
    if (courseId) {
      console.log(`[CHAT:${requestId}] 📚 Course: ${courseId} (${fileIds?.length || 0} files)`);
    }

    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ── Material loading: try RAG first, fall back to full-text keyword search ──
    let context: string;
    let fileCount: number;
    let fileNames: string[];
    let hasMaterials: boolean;
    let usedRAG = false;

    if (courseId) {
      console.log(`[CHAT:${requestId}] 🔍 Attempting semantic retrieval (RAG)...`);
      const ragResult = await loadCourseMaterialsRAG(message, courseId);
      if (ragResult && ragResult.chunkCount > 0) {
        context    = ragResult.text;
        fileCount  = ragResult.fileCount;
        fileNames  = ragResult.fileNames;
        hasMaterials = true;
        usedRAG    = true;
        console.log(`[CHAT:${requestId}] ✅ RAG: ${ragResult.chunkCount} chunks from ${fileCount} file(s): ${fileNames.join(', ')}`);
      } else {
        console.log(`[CHAT:${requestId}] ↩️  RAG unavailable, falling back to full-text search`);
        const fallback = await loadCourseMaterials(fileIds);
        hasMaterials = fallback.fileCount > 0 &&
                       fallback.text !== 'No course materials uploaded yet.' &&
                       fallback.text !== 'Error loading course materials.';
        context   = hasMaterials ? selectRelevantContent(message, fallback.text, fallback.fileNames, MAX_CONTEXT_LENGTH) : fallback.text;
        fileCount = fallback.fileCount;
        fileNames = fallback.fileNames;
      }
    } else {
      console.log(`[CHAT:${requestId}] 📚 No courseId — loading all materials (full-text search)`);
      const fallback = await loadCourseMaterials(fileIds);
      hasMaterials = fallback.fileCount > 0 &&
                     fallback.text !== 'No course materials uploaded yet.' &&
                     fallback.text !== 'Error loading course materials.';
      context   = hasMaterials ? selectRelevantContent(message, fallback.text, fallback.fileNames, MAX_CONTEXT_LENGTH) : fallback.text;
      fileCount = fallback.fileCount;
      fileNames = fallback.fileNames;
    }

    console.log(`[CHAT:${requestId}] ✅ Context ready: ${context.length} chars | RAG=${usedRAG}`);

    // ── Analytics: track student questions (fire-and-forget) ──────────────────
    if (courseId && user?.role !== 'professor') {
      const supabase = createServerClient();
      supabase
        .from('courses')
        .select('name')
        .eq('id', courseId)
        .single()
        .then(({ data }) => {
          if (data) {
            trackQuestion(
              message,
              courseId,
              data.name,
              sessionId || requestId,
              user?.id,
            ).catch(() => {});
          }
        })
        .catch(() => {});
    }

    // Generate personalized system prompt if user is logged in
    let personalizedPrompt = SYSTEM_PROMPT;
    if (user) {
      const { name, preferences, memory, role } = user;
      
      // Different prompt for professors
      if (role === 'professor') {
        personalizedPrompt = `You are NYU AI Study Buddy, an intelligent assistant for NYU Abu Dhabi professors.

Your role:
- Help professors manage their courses and track student engagement
- Generate quizzes and practice materials from course content
- Provide insights about student questions and learning patterns
- Assist with course material organization and analysis
- Answer questions about course content for reference

Guidelines:
- Use information from the provided course materials when available
- For analytics questions, provide insights based on available data
- For quiz generation requests, create comprehensive, well-structured questions
- Be professional, supportive, and focused on helping professors support their students
- Provide actionable insights about student engagement and learning patterns

Tone: Professional, knowledgeable, and supportive - like an experienced academic advisor.`;
        
        personalizedPrompt += `\n\n--- PERSONALIZATION FOR PROFESSOR ${name.toUpperCase()} ---\n`;
        personalizedPrompt += `You are speaking with Professor ${name}.\n`;
        personalizedPrompt += '--- END PERSONALIZATION ---\n';
      } else {
        // Student personalization
        personalizedPrompt += `\n\n--- PERSONALIZATION FOR ${name.toUpperCase()} ---\n`;
        
        // Academic context
        personalizedPrompt += `You are speaking with ${name}`;
        if (preferences?.academicLevel) {
          personalizedPrompt += `, a ${preferences.academicLevel} student`;
        }
        if (preferences?.major) {
          personalizedPrompt += ` majoring in ${preferences.major}`;
        }
        personalizedPrompt += '.\n';
        
        // Learning style
        if (preferences?.learningStyle) {
          const learningStyles: Record<string, string> = {
            visual: 'They learn best with diagrams, charts, and visual representations. Include visual descriptions when helpful.',
            auditory: 'They learn best through verbal explanations. Use conversational language.',
            reading: 'They learn best through reading and written materials. Provide detailed written explanations.',
            kinesthetic: 'They learn best through hands-on examples. Include practice problems and real-world applications.',
          };
          personalizedPrompt += learningStyles[preferences.learningStyle] + '\n';
        }
        
        // Response style
        if (preferences?.responseStyle) {
          const responseStyles: Record<string, string> = {
            concise: 'Keep responses brief and to the point.',
            detailed: 'Provide thorough, comprehensive explanations.',
            'step-by-step': 'Break down explanations into clear, numbered steps.',
          };
          personalizedPrompt += responseStyles[preferences.responseStyle] + '\n';
        }
        
        // Tone
        if (preferences?.tone) {
          const tones: Record<string, string> = {
            formal: 'Maintain a professional and formal tone.',
            casual: 'Use a friendly, conversational tone.',
            encouraging: 'Be supportive, encouraging, and positive.',
          };
          personalizedPrompt += tones[preferences.tone] + '\n';
        }
        
        // Memory context
        if (memory) {
          if (memory.topics && memory.topics.length > 0) {
            const recentTopics = memory.topics.slice(-10);
            personalizedPrompt += `\nTopics ${name} has recently studied: ${recentTopics.join(', ')}. You can reference these and build upon prior knowledge.\n`;
          }
          if (memory.strengths && memory.strengths.length > 0) {
            personalizedPrompt += `Their strengths: ${memory.strengths.join(', ')}. You can reference these when relevant.\n`;
          }
          if (memory.weaknesses && memory.weaknesses.length > 0) {
            personalizedPrompt += `They need extra help with: ${memory.weaknesses.join(', ')}. Provide more detailed explanations for these topics.\n`;
          }
          if (memory.recentQuestions && memory.recentQuestions.length > 0) {
            const recentQ = memory.recentQuestions.slice(0, 5);
            personalizedPrompt += `\nRecent questions ${name} asked: ${recentQ.map(q => `"${q.substring(0, 50)}..."`).join('; ')}. Consider this context when answering.\n`;
          }
          if (memory.notes) {
            personalizedPrompt += `\nAdditional notes about the student: ${memory.notes}\n`;
          }
        }
        
        personalizedPrompt += '--- END PERSONALIZATION ---\n';
      }
    }
    
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: personalizedPrompt },
    ];

    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    let userMessageContent: string;
    
    const isProfessor = user?.role === 'professor';
    
    if (hasMaterials) {
      if (isProfessor) {
        userMessageContent = `
=== AVAILABLE COURSE MATERIALS (${fileCount} files) ===
Files loaded: ${fileNames.join(', ')}

${context}

=== END OF COURSE MATERIALS ===

Professor Question: ${message}

INSTRUCTIONS: 
1. Search through ALL the course materials above to find relevant information
2. The materials include ${fileCount} files: ${fileNames.join(', ')}
3. If the question is about student engagement, analytics, or quiz generation, provide helpful insights
4. If the answer is found in the course materials, provide a complete response with citations
5. If you cannot find the specific information after checking all files, let the professor know and suggest alternatives
6. For quiz generation requests, create comprehensive questions based on the materials
7. For analytics questions, provide insights about student learning patterns`;
      } else {
        userMessageContent = `
=== AVAILABLE COURSE MATERIALS (${fileCount} files) ===
Files loaded: ${fileNames.join(', ')}

${context}

=== END OF COURSE MATERIALS ===

Student Question: ${message}

CRITICAL INSTRUCTIONS: 
1. Search through ALL the course materials above to find relevant information
2. The materials include ${fileCount} files: ${fileNames.join(', ')}
3. If the answer is found in the course materials, provide a complete response with citations (mention which file the information came from)
4. If you cannot find the specific information after checking all files, you MUST ONLY respond with: "I don't find that information in the uploaded course materials. Please check your syllabus or consult your professor."
5. DO NOT provide any answer, explanation, or general knowledge if the information is not in the course materials above
6. DO NOT use your general knowledge to answer questions not covered in the uploaded materials`;
      }
    } else {
      userMessageContent = `Note: ${context}\n\nStudent Question: ${message}\n\nCRITICAL: You MUST ONLY respond with: "No course materials are available. Please upload course materials first." DO NOT provide any answer or explanation to the question.`;
    }
    messages.push({ role: 'user', content: userMessageContent });

    console.log(`[CHAT:${requestId}] 🌊 Creating streaming response...`);
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log(`[CHAT:${requestId}] 🤖 Connecting to AI Gateway...`);
          console.log(`[CHAT:${requestId}]   Model: ${modelToUse}`);
          console.log(`[CHAT:${requestId}]   Gateway: ${process.env.PORTKEY_BASE_URL || 'Portkey Cloud'}`);
          
          let response: any;
          
          try {
            const portkey = await getPortkeyClient();
            response = await portkey.chat.completions.create({
              model: modelToUse,
              messages: messages as any,
              max_tokens: 4000,
              temperature: 0.3,
              stream: true,
            });
            console.log(`[CHAT:${requestId}] ✅ Connected via SDK`);
          } catch (sdkError: any) {
            console.error(`[CHAT:${requestId}] ⚠️  SDK error:`, sdkError?.message);
            
            const isNetworkError = 
              sdkError?.message?.includes('fetch failed') || 
              sdkError?.message?.includes('Cannot connect') ||
              sdkError?.cause?.code === 'UND_ERR_CONNECT';
            
            if (isNetworkError) {
              console.log(`[CHAT:${requestId}] 🔄 Trying direct fetch...`);
              
              const apiKey = process.env.PORTKEY_API_KEY;
              const baseURL = process.env.PORTKEY_BASE_URL || "https://ai-gateway.apps.cloud.rt.nyu.edu/v1";
              
              const fetchResponse = await fetch(`${baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: modelToUse,
                  messages: messages,
                  max_tokens: 4000,
                  temperature: 0.3,
                  stream: true,
                }),
                signal: AbortSignal.timeout(90000), // Increased timeout
              });
              
              if (!fetchResponse.ok) {
                const errorText = await fetchResponse.text();
                throw new Error(`API error (${fetchResponse.status}): ${errorText.substring(0, 200)}`);
              }
              
              if (!fetchResponse.body) {
                throw new Error('No response body');
              }
              
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
                                  content: data.choices?.[0]?.delta?.content || '' 
                                } 
                              }] 
                            };
                          }
                        } catch (e) {
                          // Skip invalid JSON
                        }
                      }
                    }
                  }
                }
              };
              
              console.log(`[CHAT:${requestId}] ✅ Connected via direct fetch`);
            } else {
              throw sdkError;
            }
          }
          
          let totalContentLength = 0;

          for await (const chunk of response) {
            const content = chunk.choices?.[0]?.delta?.content || '';
            if (content) {
              totalContentLength += content.length;
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          
          console.log(`[CHAT:${requestId}] ✅ Stream completed: ${totalContentLength} chars`);

          if (totalContentLength === 0) {
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ error: 'No response from AI. Please try again.' })}\n\n`)
            );
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error(`[CHAT:${requestId}] ❌ ERROR:`, error instanceof Error ? error.message : String(error));
          
          let userMessage = error instanceof Error ? error.message : 'Unknown error';
          
          // Provide helpful error for network issues
          if (userMessage.includes('fetch failed') || userMessage.includes('Cannot connect') || userMessage.includes('UND_ERR_CONNECT') || userMessage.includes('timeout')) {
            userMessage = '⚠️ Cannot connect to NYU AI Gateway.\n\n' +
              'The NYU AI Gateway is only accessible from within NYU\'s network. To use the chat:\n\n' +
              '1. Connect to NYU VPN (if off-campus)\n' +
              '2. Or use the app while on NYU campus network\n\n' +
              'If you are already connected, please check your VPN connection and try again.';
          }
          
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: userMessage })}\n\n`)
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
    console.error(`[CHAT:${requestId}] ❌ ERROR:`, error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

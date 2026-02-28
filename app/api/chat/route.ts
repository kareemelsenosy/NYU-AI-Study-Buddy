import { NextRequest } from 'next/server';
import { getPortkeyClient, SYSTEM_PROMPT, AI_MODEL } from '@/lib/portkey';
import { embedText } from '@/lib/embeddings';
import { createServerClient } from '@/lib/supabase';
import { trackQuestion } from '@/lib/analytics';
import { ChatRequest, Message } from '@/types';

const RAG_CHUNK_COUNT = 15;       // number of candidate chunks to fetch

// ── RAG: semantic retrieval via pgvector ─────────────────────────────────────
type RagStatus = 'ok' | 'no_embeddings' | 'no_match' | 'error';

interface RagResult {
  text: string;
  fileCount: number;
  fileNames: string[];
  chunkCount: number;
  status: RagStatus;
}

async function loadCourseMaterialsRAG(
  question: string,
  courseId: string,
): Promise<RagResult> {
  const empty = (status: RagStatus): RagResult =>
    ({ text: '', fileCount: 0, fileNames: [], chunkCount: 0, status });

  try {
    const supabase = createServerClient();

    // Check whether any chunks have been embedded for this course
    const { count } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId);

    if (!count || count === 0) {
      console.log('[RAG] No chunks found for this course');
      return empty('no_embeddings');
    }

    console.log(`[RAG] ${count} chunks available — running similarity search`);

    type Chunk = { file_name: string; chunk_index: number; content: string; similarity?: number };

    // Run similarity search + fetch intro chunks in parallel
    const questionEmbedding = await embedText(question);
    const embeddingStr = `[${questionEmbedding.join(',')}]`;

    const [similarityResult, introResult] = await Promise.all([
      supabase.rpc('match_documents', {
        query_embedding: embeddingStr,
        match_course_id: courseId,
        match_count: RAG_CHUNK_COUNT,
      }),
      // Always pull the first 3 chunks of every file — these contain overview/ToC/intro content
      supabase
        .from('document_chunks')
        .select('file_name, chunk_index, content')
        .eq('course_id', courseId)
        .lte('chunk_index', 2)
        .order('file_name')
        .order('chunk_index'),
    ]);

    if (similarityResult.error) {
      console.warn('[RAG] match_documents error:', similarityResult.error.message);
      return empty('error');
    }

    const similarChunks = (similarityResult.data as Chunk[]) || [];
    const introChunks   = (introResult.data   as Chunk[]) || [];

    // Merge: intro chunks first, then similarity results, deduplicated by file+index
    const seen = new Set<string>();
    const merged: Chunk[] = [];
    for (const c of [...introChunks, ...similarChunks]) {
      const key = `${c.file_name}::${c.chunk_index}`;
      if (!seen.has(key)) { seen.add(key); merged.push(c); }
    }

    if (merged.length === 0) {
      console.log('[RAG] match_documents returned 0 chunks');
      return empty('no_match');
    }

    const topSim = similarChunks[0]?.similarity?.toFixed(3) ?? 'n/a';
    console.log(`[RAG] ✅ ${merged.length} chunks (${introChunks.length} intro + ${similarChunks.length} similarity, top sim: ${topSim})`);

    const fileNames = [...new Set(merged.map(c => c.file_name))];
    const contextText = merged
      .map(c => `[Source: ${c.file_name}, section ${c.chunk_index + 1}]\n${c.content}`)
      .join('\n\n---\n\n');

    return {
      text: contextText,
      fileCount: fileNames.length,
      fileNames,
      chunkCount: merged.length,
      status: 'ok',
    };
  } catch (err) {
    console.warn('[RAG] Retrieval error:', err);
    return empty('error');
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

    // ── Course validation: check course exists and is accessible ─────────────
    let validatedCourseId = courseId;
    if (courseId) {
      const courseSupabase = createServerClient();
      const { data: courseRow } = await courseSupabase
        .from('courses')
        .select('is_visible, professor_id')
        .eq('id', courseId)
        .single();

      if (!courseRow) {
        // Course doesn't exist — proceed without course context
        validatedCourseId = undefined;
        console.log(`[CHAT:${requestId}] ⚠️  Course ${courseId} not found — proceeding without course context`);
      } else if (user?.role !== 'professor' && !courseRow.is_visible) {
        // Student trying to access a hidden course — deny course context silently
        validatedCourseId = undefined;
        console.log(`[CHAT:${requestId}] ⚠️  Course ${courseId} is hidden — student access denied for course context`);
      }
    }

    // ── Material loading: RAG only — never dump full file text ───────────────
    let context: string;
    let fileCount: number;
    let fileNames: string[];
    let hasMaterials: boolean;

    if (validatedCourseId) {
      console.log(`[CHAT:${requestId}] 🔍 Running semantic retrieval (RAG)...`);
      const rag = await loadCourseMaterialsRAG(message, validatedCourseId);

      if (rag.status === 'ok') {
        context      = rag.text;
        fileCount    = rag.fileCount;
        fileNames    = rag.fileNames;
        hasMaterials = true;
        console.log(`[CHAT:${requestId}] ✅ RAG: ${rag.chunkCount} chunks from ${rag.fileCount} file(s)`);
      } else if (rag.status === 'no_embeddings') {
        context      = 'Course files are still being processed. Please wait a moment and try again.';
        fileCount    = 0;
        fileNames    = [];
        hasMaterials = false;
        console.log(`[CHAT:${requestId}] ⚠️  No embeddings yet for this course`);
      } else if (rag.status === 'no_match') {
        // match_documents returned 0 rows — extremely rare with threshold removed
        context      = 'No matching sections were found in the course materials for this query.';
        fileCount    = 0;
        fileNames    = [];
        hasMaterials = false;
        console.log(`[CHAT:${requestId}] ⚠️  RAG returned 0 chunks`);
      } else {
        // error
        context      = 'Course materials could not be retrieved due to a system error.';
        fileCount    = 0;
        fileNames    = [];
        hasMaterials = false;
        console.log(`[CHAT:${requestId}] ⚠️  RAG error`);
      }
    } else {
      context      = 'No course selected.';
      fileCount    = 0;
      fileNames    = [];
      hasMaterials = false;
      console.log(`[CHAT:${requestId}] 📚 No courseId — no materials loaded`);
    }

    console.log(`[CHAT:${requestId}] ✅ Context ready: ${context.length} chars`);

    // ── Analytics: track student questions (fire-and-forget) ──────────────────
    if (validatedCourseId && user?.role !== 'professor') {
      void (async () => {
        try {
          const supabase = createServerClient();
          const { data } = await supabase
            .from('courses')
            .select('name')
            .eq('id', validatedCourseId!)
            .single();
          if (data) {
            await trackQuestion(
              message,
              validatedCourseId!,
              data.name,
              sessionId || requestId,
              user?.id,
            );
          }
        } catch {
          // fire-and-forget — ignore errors
        }
      })();
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
    
    if (isProfessor) {
      // Professors: full unrestricted access — course materials provided as context but not a constraint
      const materialsBlock = hasMaterials
        ? `=== COURSE MATERIALS (${fileCount} files: ${fileNames.join(', ')}) ===\n${context}\n=== END OF COURSE MATERIALS ===\n\n`
        : '';
      userMessageContent = `${materialsBlock}Professor Question: ${message}

You have full unrestricted access to answer this question using your complete knowledge. Use the course materials above as helpful context when relevant, but feel free to draw on your full capabilities for any topic — including general subject matter, pedagogy, quiz generation, analytics insights, explanations, examples, and anything else that would help a professor.`;

    } else if (hasMaterials) {
      // Students: course materials as primary source; supplement with general knowledge ONLY for topics mentioned in materials
      userMessageContent = `
=== COURSE MATERIALS (${fileCount} files: ${fileNames.join(', ')}) ===

${context}

=== END OF COURSE MATERIALS ===

Student Question: ${message}

INSTRUCTIONS:
1. First check whether the student's question relates to a topic mentioned or covered in the course materials above
2. If the topic IS present in the materials:
   - Answer using the course materials as the primary source (cite file/section)
   - Then supplement with any additional explanation, examples, or context from your knowledge that helps the student understand the topic better
   - Give a thorough, complete answer — there is NO length limit, do not cut answers short, cover the topic fully with examples, step-by-step breakdowns, and any relevant details that aid understanding
3. If the topic is NOT mentioned anywhere in the course materials:
   - Respond with: "This topic doesn't appear to be covered in your course materials. Please check with your professor."
   - Do NOT answer the question
4. For broad questions ("what topics are covered?", "what is this course about?"), describe the subjects and themes visible across all retrieved sections in full detail`;

    } else {
      // Students: no materials available at all
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
              max_tokens: 8000,
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
                  max_tokens: 8000,
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

import { NextRequest } from 'next/server';
import { getPortkeyClient, SYSTEM_PROMPT, AI_MODEL } from '@/lib/portkey';
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

    for (const file of files) {
      try {
        const response = await fetch(file.url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const extracted = await extractTextFromFile(file.name, buffer);

        if (extracted.text && !extracted.error) {
          materialTexts.push(`\n\n=== ${file.name} ===\n${extracted.text}`);
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

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
          const portkey = getPortkeyClient();
          const response = await portkey.chat.completions.create({
            model: AI_MODEL, // Configurable via AI_MODEL environment variable
            messages: messages as any,
            max_tokens: 1500,
            temperature: 0.3,
            stream: true,
          });

          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Portkey API error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
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



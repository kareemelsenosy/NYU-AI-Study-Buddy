import { NextRequest } from 'next/server';
import { getPortkeyClient, AI_MODEL } from '@/lib/portkey';

export async function GET() {
  try {
    const portkey = getPortkeyClient();
    
    const response = await portkey.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'user', content: 'Say "Hello" in one word' }
      ],
      max_tokens: 10,
      stream: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: response.choices[0]?.message?.content || 'No response',
        model: AI_MODEL,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Portkey test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}


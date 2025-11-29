import { NextRequest } from 'next/server';
import { getPortkeyClient, AI_MODEL } from '@/lib/portkey';

// Prevent this route from being pre-rendered during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('Testing Portkey connection...');
    console.log('AI_MODEL:', AI_MODEL);
    console.log('PORTKEY_API_KEY exists:', !!process.env.PORTKEY_API_KEY);
    console.log('PORTKEY_BASE_URL:', process.env.PORTKEY_BASE_URL);

    const portkey = await getPortkeyClient();
    
    // Test with same configuration as TypeScript example
    const response = await portkey.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'What is Portkey' }
      ],
      max_tokens: 512,
      stream: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: response.choices[0]?.message?.content || 'No response',
        model: AI_MODEL,
        portkeyBaseUrl: process.env.PORTKEY_BASE_URL,
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
        portkeyApiKey: process.env.PORTKEY_API_KEY ? `${process.env.PORTKEY_API_KEY.substring(0, 10)}...` : 'not set',
        portkeyBaseUrl: process.env.PORTKEY_BASE_URL || 'not set',
        aiModel: process.env.AI_MODEL || 'not set',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}


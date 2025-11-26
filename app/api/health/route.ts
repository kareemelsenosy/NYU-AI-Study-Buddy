import { NextRequest } from 'next/server';

export async function GET() {
  // Check environment variables (without exposing sensitive values)
  const envCheck = {
    hasPortkeyKey: !!process.env.PORTKEY_API_KEY,
    portkeyKeyLength: process.env.PORTKEY_API_KEY?.length || 0,
    portkeyKeyPrefix: process.env.PORTKEY_API_KEY?.substring(0, 10) || 'not set',
    hasPortkeyBaseUrl: !!process.env.PORTKEY_BASE_URL,
    portkeyBaseUrl: process.env.PORTKEY_BASE_URL || 'not set',
    hasAiModel: !!process.env.AI_MODEL,
    aiModel: process.env.AI_MODEL || 'not set',
    hasBlobToken: !!(process.env.Files_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN),
    blobTokenPrefix: (process.env.Files_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN)?.substring(0, 20) || 'not set',
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
  };

  return new Response(
    JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      envCheck,
      message: 'Health check endpoint - check envCheck object for environment variable status',
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}


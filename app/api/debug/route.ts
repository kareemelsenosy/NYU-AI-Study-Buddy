import { NextRequest, NextResponse } from 'next/server';

// This endpoint shows EXACTLY what environment variables are available
// Use this to debug environment variable issues
export async function GET(req: NextRequest) {
  // Get all environment variables that start with PORTKEY, AI_, Files_, BLOB_, or NEXT_PUBLIC
  const envVars: Record<string, any> = {};
  
  // Check all possible variable names
  const variablesToCheck = [
    'PORTKEY_API_KEY',
    'PORTKEY_BASE_URL',
    'AI_MODEL',
    'Files_READ_WRITE_TOKEN',
    'BLOB_READ_WRITE_TOKEN',
    'BLOB_TOKEN',
    'VERCEL_BLOB_TOKEN',
    'NEXT_PUBLIC_APP_URL',
  ];
  
  for (const varName of variablesToCheck) {
    const value = process.env[varName];
    envVars[varName] = {
      exists: !!value,
      length: value?.length || 0,
      // Show first 10 chars and last 5 chars for security
      preview: value 
        ? `${value.substring(0, 10)}...${value.substring(value.length - 5)}`
        : 'NOT SET',
      // For API keys, show if it matches expected format
      isValid: varName === 'PORTKEY_API_KEY' 
        ? (value === '3QNI3x+PPoiQlnL5Jh348nMmUtz8' || value?.length === 32)
        : varName === 'PORTKEY_BASE_URL'
        ? (value === 'https://ai-gateway.apps.cloud.rt.nyu.edu/v1')
        : varName === 'AI_MODEL'
        ? (value === '@gpt-4o/gpt-4o')
        : varName === 'Files_READ_WRITE_TOKEN'
        ? (value?.startsWith('vercel_blob_rw_'))
        : true,
    };
  }
  
  // Also check all env vars (for debugging)
  const allEnvKeys = Object.keys(process.env).filter(key => 
    key.includes('PORTKEY') || 
    key.includes('BLOB') || 
    key.includes('FILES') ||
    key.includes('AI_') ||
    key.includes('VERCEL')
  );
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL ? 'true' : 'false',
    region: process.env.VERCEL_REGION || 'unknown',
    environment_variables: envVars,
    all_related_env_keys: allEnvKeys,
    critical_checks: {
      hasPortkeyKey: !!process.env.PORTKEY_API_KEY,
      portkeyKeyMatches: process.env.PORTKEY_API_KEY === '3QNI3x+PPoiQlnL5Jh348nMmUtz8',
      hasPortkeyBaseUrl: !!process.env.PORTKEY_BASE_URL,
      portkeyBaseUrlMatches: process.env.PORTKEY_BASE_URL === 'https://ai-gateway.apps.cloud.rt.nyu.edu/v1',
      hasAiModel: !!process.env.AI_MODEL,
      aiModelMatches: process.env.AI_MODEL === '@gpt-4o/gpt-4o',
      hasBlobToken: !!(process.env.Files_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN),
      blobTokenFormat: (process.env.Files_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN)?.startsWith('vercel_blob_rw_'),
    },
    recommendations: (() => {
      const recs: string[] = [];
      if (!process.env.PORTKEY_API_KEY) {
        recs.push('❌ PORTKEY_API_KEY is missing - Add it in Vercel Settings → Environment Variables');
      } else if (process.env.PORTKEY_API_KEY !== '3QNI3x+PPoiQlnL5Jh348nMmUtz8') {
        recs.push('⚠️ PORTKEY_API_KEY value does not match expected - Verify it in Vercel');
      }
      if (!process.env.PORTKEY_BASE_URL) {
        recs.push('❌ PORTKEY_BASE_URL is missing - Add it in Vercel Settings → Environment Variables');
      }
      if (!process.env.AI_MODEL) {
        recs.push('❌ AI_MODEL is missing - Add it in Vercel Settings → Environment Variables');
      }
      if (!process.env.Files_READ_WRITE_TOKEN && !process.env.BLOB_READ_WRITE_TOKEN) {
        recs.push('❌ Files_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN is missing - Add it in Vercel');
      }
      if (recs.length === 0) {
        recs.push('✅ All critical environment variables appear to be set correctly!');
        recs.push('💡 If still not working, try redeploying after setting variables');
      }
      return recs;
    })(),
  }, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}


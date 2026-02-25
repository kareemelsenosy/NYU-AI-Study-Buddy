import { NextRequest, NextResponse } from 'next/server';
import { ensureBucket } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // Check exact values to verify they match expected
  const portkeyKey = process.env.PORTKEY_API_KEY;
  const portkeyBaseUrl = process.env.PORTKEY_BASE_URL;
  const aiModel = process.env.AI_MODEL;
  const blobToken = process.env.Files_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN;
  
  const envVars = {
    PORTKEY_API_KEY: {
      exists: !!portkeyKey,
      length: portkeyKey?.length || 0,
      matchesExpected: portkeyKey === '3QNI3x+PPoiQlnL5Jh348nMmUtz8',
      preview: portkeyKey ? `${portkeyKey.substring(0, 10)}...${portkeyKey.substring(portkeyKey.length - 5)}` : 'NOT SET',
    },
    PORTKEY_BASE_URL: {
      exists: !!portkeyBaseUrl,
      value: portkeyBaseUrl || 'Not Set (using default: https://ai-gateway.apps.cloud.rt.nyu.edu/v1)',
      matchesExpected: portkeyBaseUrl === 'https://ai-gateway.apps.cloud.rt.nyu.edu/v1',
    },
    AI_MODEL: {
      exists: !!aiModel,
      value: aiModel || 'Not Set (using default: @gpt-4o/gpt-4o)',
      matchesExpected: aiModel === '@gpt-4o/gpt-4o',
    },
    Files_READ_WRITE_TOKEN: {
      exists: !!blobToken,
      length: blobToken?.length || 0,
      hasCorrectPrefix: blobToken?.startsWith('vercel_blob_rw_') || false,
      preview: blobToken ? `${blobToken.substring(0, 15)}...${blobToken.substring(blobToken.length - 5)}` : 'NOT SET',
    },
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'Not Set',
  };

  const missingVars: string[] = [];
  const incorrectVars: string[] = [];
  
  if (!envVars.PORTKEY_API_KEY.exists) {
    missingVars.push('PORTKEY_API_KEY');
  } else if (!envVars.PORTKEY_API_KEY.matchesExpected) {
    incorrectVars.push('PORTKEY_API_KEY (value does not match expected)');
  }
  
  if (!envVars.PORTKEY_BASE_URL.exists && !envVars.PORTKEY_BASE_URL.matchesExpected) {
    incorrectVars.push('PORTKEY_BASE_URL (using default, may not match)');
  }
  
  if (!envVars.AI_MODEL.exists && !envVars.AI_MODEL.matchesExpected) {
    incorrectVars.push('AI_MODEL (using default, may not match)');
  }
  
  if (!envVars.Files_READ_WRITE_TOKEN.exists) {
    missingVars.push('Files_READ_WRITE_TOKEN or BLOB_READ_WRITE_TOKEN');
  } else if (!envVars.Files_READ_WRITE_TOKEN.hasCorrectPrefix) {
    incorrectVars.push('Files_READ_WRITE_TOKEN (does not start with vercel_blob_rw_)');
  }

  const status = missingVars.length > 0 
    ? 'ERROR: Missing Environment Variables' 
    : incorrectVars.length > 0
    ? 'WARNING: Some variables may be incorrect'
    : 'OK';

  // ── Storage bucket check ────────────────────────────────────────────────────
  let storageStatus: { ok: boolean; bucket: string; message: string } | null = null;
  try {
    storageStatus = await ensureBucket();
  } catch (err) {
    storageStatus = { ok: false, bucket: 'unknown', message: String(err) };
  }

  if (storageStatus && !storageStatus.ok) {
    missingVars.push(`Storage bucket: ${storageStatus.message}`);
  }

  return NextResponse.json({
    status,
    message: missingVars.length > 0
      ? `Missing: ${missingVars.join(', ')}`
      : incorrectVars.length > 0
      ? `Issues: ${incorrectVars.join(', ')}`
      : 'All critical environment variables are set correctly.',
    environment_variables: envVars,
    storage: storageStatus,
    issues: {
      missing: missingVars,
      incorrect: incorrectVars,
    },
    timestamp: new Date().toISOString(),
    recommendations: missingVars.length > 0 || incorrectVars.length > 0
      ? [
          '1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables',
          '2. Verify all variables are set for Production, Preview, AND Development',
          '3. Check exact spelling (case-sensitive)',
          '4. Make sure no extra spaces or quotes',
          '5. Redeploy after adding/updating variables',
        ]
      : ['All variables look good! If still not working, check Vercel function logs.'],
  });
}

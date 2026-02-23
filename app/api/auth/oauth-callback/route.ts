import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const { access_token, role } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: 'No access token provided' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Verify the token and retrieve the authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser(access_token);

  if (authError || !authUser) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const email = authUser.email || '';
  if (!email.endsWith('@nyu.edu')) {
    return NextResponse.json(
      { error: 'Only @nyu.edu email addresses are allowed' },
      { status: 403 }
    );
  }

  // Check if user already exists in our users table (by email)
  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json({ user: rowToUser(existing) });
  }

  // New user — create a record using the Supabase Auth UUID as the id
  const name =
    authUser.user_metadata?.full_name ||
    authUser.user_metadata?.name ||
    authUser.user_metadata?.preferred_username ||
    email.split('@')[0];

  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      name,
      email,
      password_hash: 'microsoft-oauth', // sentinel — Microsoft OAuth users have no password
      role: role || 'student',
      learning_style: 'reading',
      academic_level: 'sophomore',
      major: '',
      preferred_language: 'English',
      response_style: 'detailed',
      tone: 'encouraging',
      memory_topics: [],
      memory_strengths: [],
      memory_weaknesses: [],
      recent_questions: [],
      memory_notes: '',
      memory_last_updated: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertError || !newUser) {
    console.error('[oauth-callback] Insert error:', JSON.stringify(insertError));
    return NextResponse.json({ error: insertError?.message || 'Failed to create user account' }, { status: 500 });
  }

  return NextResponse.json({ user: rowToUser(newUser) });
}

function rowToUser(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: new Date(row.created_at as string),
    preferences: {
      learningStyle: row.learning_style || 'reading',
      academicLevel: row.academic_level || 'sophomore',
      major: row.major || '',
      preferredLanguage: row.preferred_language || 'English',
      responseStyle: row.response_style || 'detailed',
      tone: row.tone || 'encouraging',
    },
    memory: {
      topics: row.memory_topics || [],
      strengths: row.memory_strengths || [],
      weaknesses: row.memory_weaknesses || [],
      recentQuestions: row.recent_questions || [],
      notes: row.memory_notes || '',
      lastUpdated: new Date((row.memory_last_updated as string) || new Date().toISOString()),
    },
  };
}

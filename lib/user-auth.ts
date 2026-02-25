import { User, UserPreferences, UserMemory, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

// Simple password hashing (for demo - in production use bcrypt or similar)
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

// Generate unique ID
function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Default preferences for new users
const defaultPreferences: UserPreferences = {
  learningStyle: 'reading',
  academicLevel: 'sophomore',
  major: '',
  preferredLanguage: 'English',
  responseStyle: 'detailed',
  tone: 'encouraging',
};

// Default memory for new users
const defaultMemory: UserMemory = {
  topics: [],
  strengths: [],
  weaknesses: [],
  recentQuestions: [],
  notes: '',
  lastUpdated: new Date(),
};

// ── Session helpers (keep current user in localStorage for fast access) ──────
const SESSION_KEY = 'nyu-study-buddy-user';

function saveSession(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(SESSION_KEY);
  if (!data) return null;
  try {
    const user = JSON.parse(data);
    user.createdAt = new Date(user.createdAt);
    user.memory.lastUpdated = new Date(user.memory.lastUpdated);
    return user;
  } catch {
    return null;
  }
}

// ── Map DB row → User object ──────────────────────────────────────────────────
function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    password: row.password_hash as string,
    role: row.role as UserRole,
    createdAt: new Date(row.created_at as string),
    preferences: {
      learningStyle: (row.learning_style as UserPreferences['learningStyle']) || 'reading',
      academicLevel: (row.academic_level as UserPreferences['academicLevel']) || 'sophomore',
      major: (row.major as string) || '',
      preferredLanguage: (row.preferred_language as string) || 'English',
      responseStyle: (row.response_style as UserPreferences['responseStyle']) || 'detailed',
      tone: (row.tone as UserPreferences['tone']) || 'encouraging',
    },
    memory: {
      topics: (row.memory_topics as string[]) || [],
      strengths: (row.memory_strengths as string[]) || [],
      weaknesses: (row.memory_weaknesses as string[]) || [],
      recentQuestions: (row.recent_questions as string[]) || [],
      notes: (row.memory_notes as string) || '',
      lastUpdated: new Date(row.memory_last_updated as string),
    },
  };
}

// ── NYU Google OAuth Sign-In ──────────────────────────────────────────────────
export async function signInWithGoogle(role: UserRole): Promise<void> {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('pending-role', role);
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        hd: 'nyu.edu',
        prompt: 'select_account',
      },
    },
  });
  if (error) throw new Error(error.message);
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
export async function signUp(
  name: string,
  email: string,
  password: string,
  role: UserRole
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (!password || password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }
  if (!role) {
    return { success: false, error: 'Please select your role (Student or Professor).' };
  }

  const id = generateUserId();
  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password_hash: hashPassword(password),
      role,
      learning_style: defaultPreferences.learningStyle,
      academic_level: defaultPreferences.academicLevel,
      major: defaultPreferences.major,
      preferred_language: defaultPreferences.preferredLanguage,
      response_style: defaultPreferences.responseStyle,
      tone: defaultPreferences.tone,
      memory_topics: defaultMemory.topics,
      memory_strengths: defaultMemory.strengths,
      memory_weaknesses: defaultMemory.weaknesses,
      recent_questions: defaultMemory.recentQuestions,
      memory_notes: defaultMemory.notes,
      memory_last_updated: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }
    return { success: false, error: error.message };
  }

  const user = rowToUser(data);
  saveSession(user);

  // Sync role to course-management
  if (typeof window !== 'undefined') {
    import('@/lib/course-management').then(({ setUserRole }) => setUserRole(role));
  }

  return { success: true, user };
}

// ── Sign In ───────────────────────────────────────────────────────────────────
export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !data) {
    return { success: false, error: 'No account found with this email. Please sign up first.' };
  }

  if (hashPassword(password) !== data.password_hash) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  const user = rowToUser(data);
  saveSession(user);

  if (user.role && typeof window !== 'undefined') {
    import('@/lib/course-management').then(({ setUserRole }) => setUserRole(user.role!));
  }

  return { success: true, user };
}

// ── Sign Out ──────────────────────────────────────────────────────────────────
export function signOut(): void {
  if (typeof window === 'undefined') return;
  // Read userId before clearing session so we can clear the scoped course key
  const user = getCurrentUser();
  localStorage.removeItem(SESSION_KEY);
  // Clear role and selected-course state (both scoped and legacy unscoped)
  localStorage.removeItem('nyu-study-buddy-user-role');
  if (user?.id) {
    localStorage.removeItem(`nyu-study-buddy-selected-course-${user.id}`);
  }
  localStorage.removeItem('nyu-study-buddy-selected-course');
}

// ── Update Preferences ────────────────────────────────────────────────────────
export async function updatePreferences(preferences: Partial<UserPreferences>): Promise<User | null> {
  const user = getCurrentUser();
  if (!user) return null;

  const updates: Record<string, unknown> = {};
  if (preferences.learningStyle !== undefined) updates.learning_style = preferences.learningStyle;
  if (preferences.academicLevel !== undefined) updates.academic_level = preferences.academicLevel;
  if (preferences.major !== undefined) updates.major = preferences.major;
  if (preferences.preferredLanguage !== undefined) updates.preferred_language = preferences.preferredLanguage;
  if (preferences.responseStyle !== undefined) updates.response_style = preferences.responseStyle;
  if (preferences.tone !== undefined) updates.tone = preferences.tone;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  const updated = rowToUser(data);
  saveSession(updated);
  return updated;
}

// ── Update Memory ─────────────────────────────────────────────────────────────
export async function updateMemory(memory: Partial<UserMemory>): Promise<User | null> {
  const user = getCurrentUser();
  if (!user) return null;

  const updates: Record<string, unknown> = { memory_last_updated: new Date().toISOString() };
  if (memory.topics !== undefined) updates.memory_topics = memory.topics;
  if (memory.strengths !== undefined) updates.memory_strengths = memory.strengths;
  if (memory.weaknesses !== undefined) updates.memory_weaknesses = memory.weaknesses;
  if (memory.recentQuestions !== undefined) updates.recent_questions = memory.recentQuestions;
  if (memory.notes !== undefined) updates.memory_notes = memory.notes;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  const updated = rowToUser(data);
  saveSession(updated);
  return updated;
}

// ── Add Studied Topic ─────────────────────────────────────────────────────────
export async function addStudiedTopic(topic: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;
  if (user.memory.topics.includes(topic)) return;

  const newTopics = [...user.memory.topics, topic].slice(-50);
  await updateMemory({ topics: newTopics });
}

// ── Add Recent Question ───────────────────────────────────────────────────────
export async function addRecentQuestion(question: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const newQuestions = [question, ...user.memory.recentQuestions].slice(0, 20);
  await updateMemory({ recentQuestions: newQuestions });
}

// ── Learn From Conversation ───────────────────────────────────────────────────
export async function learnFromConversation(userMessage: string, aiResponse: string): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  const combinedText = (userMessage + ' ' + aiResponse).toLowerCase();
  const topicPatterns = [
    /(?:about|regarding|explain|understand|learn|study|chapter|lecture|topic)\s+([a-z\s]{3,30})/gi,
    /(?:what is|how does|how do|how to)\s+([a-z\s]{3,30})/gi,
  ];

  const extractedTopics: string[] = [];
  topicPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      const t = match[1].trim();
      if (t.length > 3 && t.split(' ').length <= 5) extractedTopics.push(t);
    }
  });

  let updated = false;
  const topics = [...user.memory.topics];
  extractedTopics.forEach(topic => {
    const normalized = topic.charAt(0).toUpperCase() + topic.slice(1);
    if (!topics.some(t => t.toLowerCase() === normalized.toLowerCase())) {
      topics.push(normalized);
      updated = true;
    }
  });

  if (updated) {
    await updateMemory({ topics: topics.slice(-50) });
  }
}

// ── Update Name ───────────────────────────────────────────────────────────────
export async function updateName(name: string): Promise<User | null> {
  const user = getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users')
    .update({ name: name.trim(), updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error || !data) return null;

  const updated = rowToUser(data);
  saveSession(updated);
  return updated;
}

// ── Delete Account ────────────────────────────────────────────────────────────
export async function deleteAccount(): Promise<void> {
  const user = getCurrentUser();
  if (!user) return;

  await supabase.from('users').delete().eq('id', user.id);
  signOut();
}

// ── Generate Personalized Prompt ──────────────────────────────────────────────
export function generatePersonalizedPrompt(user: User): string {
  const { preferences, memory, name } = user;

  let prompt = `You are speaking with ${name}, `;
  prompt += `a ${preferences.academicLevel} student`;
  if (preferences.major) prompt += ` majoring in ${preferences.major}`;
  prompt += '. ';

  const learningStyleDescriptions: Record<string, string> = {
    visual: 'They learn best with diagrams, charts, and visual representations.',
    auditory: 'They learn best through verbal explanations and discussions.',
    reading: 'They learn best through reading and written materials.',
    kinesthetic: 'They learn best through hands-on examples and practice problems.',
  };
  prompt += learningStyleDescriptions[preferences.learningStyle] + ' ';

  const responseStyleDescriptions: Record<string, string> = {
    concise: 'Keep your responses brief and to the point.',
    detailed: 'Provide thorough, comprehensive explanations.',
    'step-by-step': 'Break down explanations into clear, numbered steps.',
  };
  prompt += responseStyleDescriptions[preferences.responseStyle] + ' ';

  const toneDescriptions: Record<string, string> = {
    formal: 'Maintain a professional and formal tone.',
    casual: 'Use a friendly, conversational tone.',
    encouraging: 'Be supportive, encouraging, and positive in your responses.',
  };
  prompt += toneDescriptions[preferences.tone] + ' ';

  if (memory.topics.length > 0) {
    prompt += `\n\nTopics ${name} has studied recently: ${memory.topics.slice(-10).join(', ')}. `;
  }
  if (memory.strengths.length > 0) {
    prompt += `Their strengths include: ${memory.strengths.join(', ')}. `;
  }
  if (memory.weaknesses.length > 0) {
    prompt += `They may need extra help with: ${memory.weaknesses.join(', ')}. Provide more detailed explanations for these topics. `;
  }
  if (memory.notes) {
    prompt += `\n\nAdditional context: ${memory.notes}`;
  }

  return prompt;
}

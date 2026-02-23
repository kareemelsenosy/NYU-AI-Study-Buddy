import { ChatSession, Message } from '@/types';
import { supabase } from '@/lib/supabase';

// ── Map DB rows → ChatSession ─────────────────────────────────────────────────
function rowsToSession(
  sessionRow: Record<string, unknown>,
  messageRows: Record<string, unknown>[]
): ChatSession {
  return {
    id: sessionRow.id as string,
    title: sessionRow.title as string,
    userId: sessionRow.user_id as string | undefined,
    createdAt: new Date(sessionRow.created_at as string),
    updatedAt: new Date(sessionRow.updated_at as string),
    messages: messageRows.map(m => ({
      id: m.id as string,
      role: m.role as 'user' | 'assistant',
      content: m.content as string,
      timestamp: new Date(m.created_at as string),
    })),
  };
}

// ── Get All Sessions For Current User ────────────────────────────────────────
export async function getAllChatSessions(userId?: string): Promise<ChatSession[]> {
  let query = supabase
    .from('chat_sessions')
    .select('*')
    .order('updated_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);

  const { data: sessions, error } = await query;
  if (error || !sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map(s => s.id);
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  const messageMap: Record<string, Record<string, unknown>[]> = {};
  (messages || []).forEach(m => {
    if (!messageMap[m.session_id]) messageMap[m.session_id] = [];
    messageMap[m.session_id].push(m);
  });

  return sessions.map(s => rowsToSession(s, messageMap[s.id] || []));
}

// ── Get Single Session ────────────────────────────────────────────────────────
export async function getChatSession(id: string): Promise<ChatSession | null> {
  const { data: session, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !session) return null;

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', id)
    .order('created_at', { ascending: true });

  return rowsToSession(session, messages || []);
}

// ── Save / Update Session ─────────────────────────────────────────────────────
export async function saveChatSession(session: ChatSession): Promise<void> {
  // Upsert the session row
  await supabase.from('chat_sessions').upsert(
    {
      id: session.id,
      title: session.title,
      user_id: session.userId || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  // Upsert all messages (insert new, skip existing)
  if (session.messages.length > 0) {
    const rows = session.messages.map(m => ({
      id: m.id,
      session_id: session.id,
      role: m.role,
      content: m.content,
      created_at: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
    }));
    await supabase.from('messages').upsert(rows, { onConflict: 'id' });
  }
}

// ── Delete Session ────────────────────────────────────────────────────────────
export async function deleteChatSession(id: string): Promise<void> {
  // messages are deleted automatically via ON DELETE CASCADE
  await supabase.from('chat_sessions').delete().eq('id', id);
}

// ── Create New Session ────────────────────────────────────────────────────────
export async function createNewChatSession(title?: string, userId?: string): Promise<ChatSession> {
  const id = `chat-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const session: ChatSession = {
    id,
    title: title || 'New Chat',
    messages: [],
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await saveChatSession(session);
  return session;
}

// ── Update Title ──────────────────────────────────────────────────────────────
export async function updateChatSessionTitle(id: string, title: string): Promise<void> {
  await supabase
    .from('chat_sessions')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', id);
}

// ── Search Sessions ───────────────────────────────────────────────────────────
export async function searchChatSessions(query: string, userId?: string): Promise<ChatSession[]> {
  const all = await getAllChatSessions(userId);
  const lower = query.toLowerCase();
  return all.filter(
    s =>
      s.title.toLowerCase().includes(lower) ||
      s.messages.some(m => m.content.toLowerCase().includes(lower))
  );
}

// ── Generate Title ────────────────────────────────────────────────────────────
export async function generateChatTitle(messages: Message[]): Promise<string> {
  if (messages.length === 0) return 'New Chat';

  if (messages.length <= 2) return generateSmartTitle(messages);

  try {
    const response = await fetch('/api/generate-title', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.title || generateSmartTitle(messages);
    }
  } catch (error) {
    console.error('[ChatHistory] Error generating AI title:', error);
  }

  return generateSmartTitle(messages);
}

function generateSmartTitle(messages: Message[]): string {
  if (messages.length === 0) return 'New Chat';

  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  const content = firstUserMessage.content.trim();
  const commonWords = new Set(['what', 'how', 'why', 'when', 'where', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'for', 'with', 'about', 'can', 'could', 'should', 'would', 'will', 'this', 'that', 'these', 'those', 'do', 'does', 'did', 'explain', 'tell', 'me', 'help', 'please']);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !commonWords.has(w))
    .slice(0, 6);

  if (words.length === 0) return content.substring(0, 40).trim() || 'New Chat';

  return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

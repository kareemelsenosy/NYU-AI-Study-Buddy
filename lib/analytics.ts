import { supabase } from '@/lib/supabase';

export interface QuestionAnalytic {
  question: string;
  courseId: string;
  courseName: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

export interface EngagementStats {
  courseId: string;
  courseName: string;
  totalQuestions: number;
  uniqueStudents: number;
  activeDays: number;
  lastActivity: Date;
  questionsByDay: Record<string, number>;
}

// ── Track a Question ──────────────────────────────────────────────────────────
export async function trackQuestion(
  question: string,
  courseId: string,
  courseName: string,
  sessionId: string,
  userId?: string
): Promise<void> {
  await supabase.from('analytics_events').insert({
    question: question.trim(),
    course_id: courseId,
    course_name: courseName,
    user_id: userId || null,
    session_id: sessionId,
  });
}

// ── Get All Questions ─────────────────────────────────────────────────────────
export async function getAllQuestions(): Promise<QuestionAnalytic[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    question: row.question,
    courseId: row.course_id,
    courseName: row.course_name,
    timestamp: new Date(row.created_at),
    userId: row.user_id || undefined,
    sessionId: row.session_id,
  }));
}

// ── Get Questions For a Course ────────────────────────────────────────────────
export async function getCourseQuestions(courseId: string): Promise<QuestionAnalytic[]> {
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    question: row.question,
    courseId: row.course_id,
    courseName: row.course_name,
    timestamp: new Date(row.created_at),
    userId: row.user_id || undefined,
    sessionId: row.session_id,
  }));
}

// ── Most Asked Questions ──────────────────────────────────────────────────────
export async function getMostAskedQuestions(
  courseId?: string,
  limit: number = 10
): Promise<Array<{ question: string; count: number }>> {
  const questions = courseId ? await getCourseQuestions(courseId) : await getAllQuestions();

  const counts: Record<string, number> = {};
  questions.forEach(q => {
    const key = q.question.toLowerCase().trim();
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([question, count]) => ({ question, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ── Question Frequency Over Time ──────────────────────────────────────────────
export async function getQuestionFrequency(
  courseId?: string,
  days: number = 30
): Promise<Array<{ date: string; count: number }>> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  let query = supabase
    .from('analytics_events')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error || !data) return [];

  // Build a date → count map initialised with 0 for all days
  const dateMap: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    dateMap[d.toISOString().split('T')[0]] = 0;
  }

  data.forEach(row => {
    const dateStr = new Date(row.created_at).toISOString().split('T')[0];
    if (dateStr in dateMap) dateMap[dateStr]++;
  });

  return Object.entries(dateMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Unique Student Count ──────────────────────────────────────────────────────
export async function getUniqueStudentCount(courseId?: string): Promise<number> {
  let query = supabase.from('analytics_events').select('user_id');
  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error || !data) return 0;

  return new Set(data.map(r => r.user_id || 'guest')).size;
}

// ── Engagement Stats For a Course ─────────────────────────────────────────────
export async function getEngagementStats(
  courseId: string,
  courseName: string
): Promise<EngagementStats> {
  const questions = await getCourseQuestions(courseId);
  const uniqueStudents = new Set(questions.map(q => q.userId || 'guest')).size;

  const questionsByDay: Record<string, number> = {};
  let lastActivity = new Date(0);

  questions.forEach(q => {
    const dateStr = q.timestamp.toISOString().split('T')[0];
    questionsByDay[dateStr] = (questionsByDay[dateStr] || 0) + 1;
    if (q.timestamp > lastActivity) lastActivity = q.timestamp;
  });

  return {
    courseId,
    courseName,
    totalQuestions: questions.length,
    uniqueStudents,
    activeDays: Object.keys(questionsByDay).length,
    lastActivity,
    questionsByDay,
  };
}

// ── All Course Stats ──────────────────────────────────────────────────────────
export async function getAllCourseStats(): Promise<EngagementStats[]> {
  const allQuestions = await getAllQuestions();
  const courseMap = new Map<string, string>();
  allQuestions.forEach(q => courseMap.set(q.courseId, q.courseName));

  return Promise.all(
    Array.from(courseMap.entries()).map(([id, name]) => getEngagementStats(id, name))
  );
}

// ── Peak Activity Hours ───────────────────────────────────────────────────────
export async function getPeakHours(
  courseId?: string
): Promise<Array<{ hour: number; count: number }>> {
  let query = supabase.from('analytics_events').select('created_at');
  if (courseId) query = query.eq('course_id', courseId);

  const { data, error } = await query;
  if (error || !data) return [];

  const hourCounts: Record<number, number> = {};
  for (let i = 0; i < 24; i++) hourCounts[i] = 0;
  data.forEach(row => {
    const hour = new Date(row.created_at).getHours();
    hourCounts[hour]++;
  });

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => a.hour - b.hour);
}

// ── Question Categories / Topics ──────────────────────────────────────────────
export async function getQuestionCategories(
  courseId?: string,
  limit: number = 10
): Promise<Array<{ category: string; count: number }>> {
  const questions = courseId ? await getCourseQuestions(courseId) : await getAllQuestions();

  const categoryCounts: Record<string, number> = {};
  const stopWords = new Set(['what', 'when', 'where', 'which', 'this', 'that', 'these', 'those', 'could', 'would', 'should', 'about', 'chapter', 'explain', 'help']);

  questions.forEach(q => {
    const words = q.question.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    words.forEach(word => {
      if (!stopWords.has(word)) {
        categoryCounts[word] = (categoryCounts[word] || 0) + 1;
      }
    });
  });

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ── Clear Analytics ───────────────────────────────────────────────────────────
export async function clearAnalytics(courseId?: string): Promise<void> {
  if (courseId) {
    await supabase.from('analytics_events').delete().eq('course_id', courseId);
  } else {
    await supabase.from('analytics_events').delete().neq('id', 0);
  }
}

// ── Aliases for ProfessorAnalytics component compatibility ────────────────────
export async function getCourseAnalytics(courseId: string) {
  const questions = await getCourseQuestions(courseId);
  const uniqueStudents = new Set(questions.map(q => q.userId || 'guest')).size;
  const dates = questions.map(q => q.timestamp.toDateString());
  const activeDays = new Set(dates).size;
  const totalQuestions = questions.length;
  const avgQuestionsPerDay = activeDays > 0 ? totalQuestions / activeDays : 0;

  return { totalQuestions, uniqueStudents, activeDays, avgQuestionsPerDay };
}

export async function getQuestionActivity(courseId: string, days: number = 30) {
  return getQuestionFrequency(courseId, days);
}

export async function getPeakActivityHours(courseId: string) {
  return getPeakHours(courseId);
}

export async function getTopTopics(courseId: string, limit: number = 10) {
  const items = await getQuestionCategories(courseId, limit);
  return items.map(item => ({ topic: item.category, count: item.count }));
}

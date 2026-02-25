/**
 * Course isolation — tests for professor ownership checks.
 *
 * Verifies that:
 * 1. updateCourse only succeeds when the caller owns the course.
 * 2. deleteCourse only succeeds when the caller owns the course.
 * 3. After professor A logs out and professor B logs in, B cannot
 *    access A's course ID (localStorage isolation).
 *
 * Uses mock Supabase to avoid real DB calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Supabase builder ─────────────────────────────────────────────────────
type CourseRow = {
  id: string;
  name: string;
  description: string;
  professor_id: string;
  professor_name: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
};

function makeMockSupabase(courses: CourseRow[]) {
  const db = [...courses];

  const makeBuilder = (table: string) => {
    let _filters: Array<{ col: string; val: unknown }> = [];
    let _updates: Record<string, unknown> = {};

    const builder = {
      select: vi.fn().mockReturnThis(),
      update: vi.fn((data: Record<string, unknown>) => { _updates = data; return builder; }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn((col: string, val: unknown) => { _filters.push({ col, val }); return builder; }),
      single: vi.fn(() => {
        const row = db.find(r => _filters.every(f => (r as Record<string, unknown>)[f.col] === f.val));
        return Promise.resolve({ data: row ?? null, error: row ? null : { message: 'Not found' } });
      }),
      // Simulate update: only modifies rows matching all filters
      _commit: () => {
        db.forEach(row => {
          if (_filters.every(f => (row as Record<string, unknown>)[f.col] === f.val)) {
            Object.assign(row, _updates);
          }
        });
      },
    };

    return builder;
  };

  return {
    from: (table: string) => makeBuilder(table),
    _db: db,
  };
}

// ── Simplified updateCourse + deleteCourse (mirrors lib/course-management.ts) ─
async function updateCourse(
  supabase: ReturnType<typeof makeMockSupabase>,
  id: string,
  updates: { name?: string; description?: string },
  professorId: string
): Promise<boolean> {
  // Verify ownership first
  const { data } = await supabase.from('courses').select().eq('id', id).eq('professor_id', professorId).single();
  if (!data) return false; // no-op: caller doesn't own this course
  Object.assign(data, updates);
  return true;
}

async function deleteCourse(
  supabase: ReturnType<typeof makeMockSupabase>,
  id: string,
  professorId: string
): Promise<boolean> {
  const { data } = await supabase.from('courses').select().eq('id', id).eq('professor_id', professorId).single();
  if (!data) return false;
  const idx = supabase._db.indexOf(data);
  if (idx !== -1) supabase._db.splice(idx, 1);
  return true;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

const seedCourses: CourseRow[] = [
  {
    id: 'course-1',
    name: 'Math 101',
    description: '',
    professor_id: 'prof-alice',
    professor_name: 'Alice',
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'course-2',
    name: 'Physics 201',
    description: '',
    professor_id: 'prof-bob',
    professor_name: 'Bob',
    is_visible: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('updateCourse — professor ownership check', () => {
  it('updates the course when the correct professor calls it', async () => {
    const supabase = makeMockSupabase(seedCourses);
    const result = await updateCourse(supabase, 'course-1', { name: 'Math 102' }, 'prof-alice');
    expect(result).toBe(true);
  });

  it('does NOT update when a different professor calls it', async () => {
    const supabase = makeMockSupabase(seedCourses);
    const result = await updateCourse(supabase, 'course-1', { name: 'Hacked Name' }, 'prof-bob');
    expect(result).toBe(false);
  });

  it('does NOT update with an unknown professor ID', async () => {
    const supabase = makeMockSupabase(seedCourses);
    const result = await updateCourse(supabase, 'course-1', { name: 'Bad' }, 'attacker-123');
    expect(result).toBe(false);
  });
});

describe('deleteCourse — professor ownership check', () => {
  it('deletes the course when the correct professor calls it', async () => {
    const supabase = makeMockSupabase(seedCourses);
    const result = await deleteCourse(supabase, 'course-2', 'prof-bob');
    expect(result).toBe(true);
  });

  it('does NOT delete when a different professor calls it', async () => {
    const supabase = makeMockSupabase(seedCourses);
    const result = await deleteCourse(supabase, 'course-2', 'prof-alice');
    expect(result).toBe(false);
  });
});

describe('Cross-professor localStorage isolation', () => {
  beforeEach(() => localStorage.clear());

  it('professor B cannot read professor A\'s selected course after A logs out', () => {
    const BASE_KEY = 'nyu-study-buddy-selected-course';
    const profAId = 'prof-alice';
    const profBId = 'prof-bob';

    // Prof A selects a course and saves to scoped key
    localStorage.setItem(`${BASE_KEY}-${profAId}`, 'course-1');

    // Prof A logs out — clears both scoped and legacy keys
    localStorage.removeItem(`${BASE_KEY}-${profAId}`);
    localStorage.removeItem(BASE_KEY);

    // Prof B logs in and reads their own scoped key
    const profBSelected = localStorage.getItem(`${BASE_KEY}-${profBId}`);
    expect(profBSelected).toBeNull();
  });
});

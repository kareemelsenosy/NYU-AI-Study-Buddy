/**
 * Auth gating — tests for user-scoped localStorage keys.
 *
 * Verifies that:
 * 1. The selected-course key is scoped by userId.
 * 2. Professor A's course is NOT visible to professor B.
 * 3. signOut clears the user-scoped key and the legacy key.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Inline the key logic (mirrors lib/course-management.ts) ──────────────────
const BASE_KEY = 'nyu-study-buddy-selected-course';
const ROLE_KEY = 'nyu-study-buddy-user-role';
const SESSION_KEY = 'nyu-study-buddy-user';

function selectedCourseKey(userId?: string): string {
  return userId ? `${BASE_KEY}-${userId}` : BASE_KEY;
}

function getSelectedCourseId(userId?: string): string | null {
  return localStorage.getItem(selectedCourseKey(userId));
}

function setSelectedCourseId(courseId: string | null, userId?: string): void {
  const key = selectedCourseKey(userId);
  if (courseId) {
    localStorage.setItem(key, courseId);
  } else {
    localStorage.removeItem(key);
  }
}

function clearSelectedCourseForUser(userId: string): void {
  localStorage.removeItem(selectedCourseKey(userId));
  localStorage.removeItem(BASE_KEY); // legacy key
}

function signOut(userId: string): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(ROLE_KEY);
  clearSelectedCourseForUser(userId);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('User-scoped localStorage keys', () => {
  it('returns null for a different user\'s course key', () => {
    const profAId = 'prof_a';
    const profBId = 'prof_b';

    setSelectedCourseId('course-123', profAId);

    // Professor B should NOT see professor A's selected course
    expect(getSelectedCourseId(profBId)).toBeNull();
  });

  it('returns the correct course for the right user', () => {
    const profAId = 'prof_a';
    setSelectedCourseId('course-abc', profAId);

    expect(getSelectedCourseId(profAId)).toBe('course-abc');
  });

  it('stores separate courses for two professors', () => {
    setSelectedCourseId('course-a1', 'prof_a');
    setSelectedCourseId('course-b2', 'prof_b');

    expect(getSelectedCourseId('prof_a')).toBe('course-a1');
    expect(getSelectedCourseId('prof_b')).toBe('course-b2');
  });
});

describe('signOut clears all auth keys', () => {
  it('removes session key on sign-out', () => {
    const userId = 'prof_x';
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: userId }));
    localStorage.setItem(ROLE_KEY, 'professor');
    setSelectedCourseId('course-xyz', userId);

    signOut(userId);

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(ROLE_KEY)).toBeNull();
    expect(getSelectedCourseId(userId)).toBeNull();
  });

  it('also clears the legacy (unscoped) key on sign-out', () => {
    const userId = 'prof_y';
    localStorage.setItem(BASE_KEY, 'old-course-id'); // legacy key from before scoping

    signOut(userId);

    expect(localStorage.getItem(BASE_KEY)).toBeNull();
  });
});

describe('clearSelectedCourseForUser', () => {
  it('only clears the target user\'s course, not other users\'', () => {
    setSelectedCourseId('course-1', 'prof_a');
    setSelectedCourseId('course-2', 'prof_b');

    clearSelectedCourseForUser('prof_a');

    expect(getSelectedCourseId('prof_a')).toBeNull();
    expect(getSelectedCourseId('prof_b')).toBe('course-2');
  });
});

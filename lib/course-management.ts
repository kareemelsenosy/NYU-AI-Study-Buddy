import { Course, CourseFile, UserRole } from '@/types';
import { supabase } from '@/lib/supabase';

// ── Role helpers (role stays in localStorage — it's just a UI state) ──────────
const STORAGE_KEY_ROLE = 'nyu-study-buddy-user-role';
const STORAGE_KEY_SELECTED_COURSE = 'nyu-study-buddy-selected-course';

export function getUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const role = localStorage.getItem(STORAGE_KEY_ROLE);
    return role === 'student' || role === 'professor' ? role : null;
  } catch {
    return null;
  }
}

export function setUserRole(role: UserRole | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (role) {
      localStorage.setItem(STORAGE_KEY_ROLE, role);
    } else {
      localStorage.removeItem(STORAGE_KEY_ROLE);
    }
    window.dispatchEvent(new Event('role-change'));
  } catch (error) {
    console.error('[CourseManagement] Error saving role:', error);
  }
}

// ── Map DB row → Course object ────────────────────────────────────────────────
function rowToCourse(row: Record<string, unknown>, fileIds: string[] = []): Course {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    professorId: row.professor_id as string,
    professorName: row.professor_name as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
    fileIds,
    isVisible: row.is_visible !== false, // default to true if column doesn't exist yet
  };
}

// ── Get All Courses ───────────────────────────────────────────────────────────
export async function getAllCourses(): Promise<Course[]> {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !courses) return [];

  // Fetch file IDs for all courses in one query
  const courseIds = courses.map(c => c.id);
  const { data: files } = await supabase
    .from('course_files')
    .select('course_id, file_id')
    .in('course_id', courseIds);

  const fileMap: Record<string, string[]> = {};
  (files || []).forEach(f => {
    if (!fileMap[f.course_id]) fileMap[f.course_id] = [];
    fileMap[f.course_id].push(f.file_id);
  });

  return courses.map(c => rowToCourse(c, fileMap[c.id] || []));
}

// ── Get Visible Courses (for students) ───────────────────────────────────────
export async function getVisibleCourses(): Promise<Course[]> {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_visible', true)
    .order('created_at', { ascending: false });

  if (error || !courses) return [];

  const courseIds = courses.map(c => c.id);
  if (courseIds.length === 0) return [];

  const { data: files } = await supabase
    .from('course_files')
    .select('course_id, file_id')
    .in('course_id', courseIds);

  const fileMap: Record<string, string[]> = {};
  (files || []).forEach(f => {
    if (!fileMap[f.course_id]) fileMap[f.course_id] = [];
    fileMap[f.course_id].push(f.file_id);
  });

  return courses.map(c => rowToCourse(c, fileMap[c.id] || []));
}

// ── Toggle Course Visibility ──────────────────────────────────────────────────
export async function updateCourseVisibility(id: string, isVisible: boolean): Promise<void> {
  await supabase
    .from('courses')
    .update({ is_visible: isVisible, updated_at: new Date().toISOString() })
    .eq('id', id);
}

// ── Get Single Course ─────────────────────────────────────────────────────────
export async function getCourse(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const { data: files } = await supabase
    .from('course_files')
    .select('file_id')
    .eq('course_id', id);

  const fileIds = (files || []).map(f => f.file_id);
  return rowToCourse(data, fileIds);
}

// ── Get Courses By Professor ──────────────────────────────────────────────────
export async function getCoursesByProfessor(professorId: string): Promise<Course[]> {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('professor_id', professorId)
    .order('created_at', { ascending: false });

  if (error || !courses) return [];

  const courseIds = courses.map(c => c.id);
  const { data: files } = await supabase
    .from('course_files')
    .select('course_id, file_id')
    .in('course_id', courseIds);

  const fileMap: Record<string, string[]> = {};
  (files || []).forEach(f => {
    if (!fileMap[f.course_id]) fileMap[f.course_id] = [];
    fileMap[f.course_id].push(f.file_id);
  });

  return courses.map(c => rowToCourse(c, fileMap[c.id] || []));
}

// ── Create Course ─────────────────────────────────────────────────────────────
export async function createCourse(
  name: string,
  description: string,
  professorId: string,
  professorName: string
): Promise<Course> {
  const id = `course-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  const { data, error } = await supabase
    .from('courses')
    .insert({ id, name, description, professor_id: professorId, professor_name: professorName })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create course');
  return rowToCourse(data, []);
}

// ── Update Course ─────────────────────────────────────────────────────────────
export async function updateCourse(
  id: string,
  updates: Partial<Pick<Course, 'name' | 'description'>>,
  professorId: string
): Promise<void> {
  await supabase
    .from('courses')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.description !== undefined && { description: updates.description }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('professor_id', professorId); // Ownership check: no-op if professor doesn't own this course
}

// ── Delete Course ─────────────────────────────────────────────────────────────
export async function deleteCourse(id: string, professorId: string): Promise<void> {
  // course_files and document_chunks are deleted automatically via ON DELETE CASCADE
  await supabase.from('courses').delete().eq('id', id).eq('professor_id', professorId); // Ownership check
}

// ── Get Course Files ──────────────────────────────────────────────────────────
export async function getAllCourseFiles(): Promise<CourseFile[]> {
  const { data, error } = await supabase
    .from('course_files')
    .select('*')
    .order('uploaded_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    courseId: row.course_id,
    fileId: row.file_id,
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at),
  }));
}

export async function getCourseFiles(courseId: string): Promise<CourseFile[]> {
  const { data, error } = await supabase
    .from('course_files')
    .select('*')
    .eq('course_id', courseId)
    .order('uploaded_at', { ascending: false });

  if (error || !data) return [];

  return data.map(row => ({
    courseId: row.course_id,
    fileId: row.file_id,
    fileName: row.file_name,
    uploadedAt: new Date(row.uploaded_at),
  }));
}

// ── Add File To Course ────────────────────────────────────────────────────────
export async function addFileToCourse(
  courseId: string,
  fileId: string,
  fileName: string,
  fileUrl: string = '',
  fileSize: number = 0,
  fileType: string = 'unknown'
): Promise<void> {
  await supabase
    .from('course_files')
    .upsert(
      { course_id: courseId, file_id: fileId, file_name: fileName, file_url: fileUrl, file_size: fileSize, file_type: fileType },
      { onConflict: 'course_id,file_id' }
    );
}

// ── Remove File From Course ───────────────────────────────────────────────────
export async function removeFileFromCourse(courseId: string, fileId: string): Promise<void> {
  await supabase
    .from('course_files')
    .delete()
    .eq('course_id', courseId)
    .eq('file_id', fileId);
}

// ── Selected Course (stays in localStorage — it's just a UI state) ────────────
export function getSelectedCourseId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY_SELECTED_COURSE);
  } catch {
    return null;
  }
}

export function setSelectedCourseId(courseId: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (courseId) {
      localStorage.setItem(STORAGE_KEY_SELECTED_COURSE, courseId);
    } else {
      localStorage.removeItem(STORAGE_KEY_SELECTED_COURSE);
    }
    window.dispatchEvent(new Event('selected-course-change'));
  } catch (error) {
    console.error('[CourseManagement] Error saving selected course:', error);
  }
}

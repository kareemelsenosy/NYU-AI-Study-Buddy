export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  url: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: Message[];
  model?: string; // Optional: AI model to use
  courseId?: string; // Optional: Course ID to filter materials
  fileIds?: string[]; // Optional: Specific file IDs to include (for course filtering)
  user?: {
    id?: string;
    name: string;
    preferences: UserPreferences;
    memory: UserMemory;
    role?: UserRole;
  } | null;
  sessionId?: string; // for analytics tracking
}

export interface UploadResponse {
  success: boolean;
  files?: FileMetadata[];
  error?: string;
}

export interface FileListResponse {
  files: FileMetadata[];
}

export type FileType = 'pdf' | 'pptx' | 'docx' | 'xlsx' | 'txt' | 'unknown';

export interface ExtractedText {
  filename: string;
  text: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Optional user association
}

// User Account Types
export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Hashed password
  role?: UserRole; // Student or Professor
  createdAt: Date;
  preferences: UserPreferences;
  memory: UserMemory;
}

export interface UserPreferences {
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  academicLevel: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
  major: string;
  preferredLanguage: string;
  responseStyle: 'concise' | 'detailed' | 'step-by-step';
  tone: 'formal' | 'casual' | 'encouraging';
}

export interface UserMemory {
  topics: string[]; // Topics the user has studied
  strengths: string[]; // Areas user is strong in
  weaknesses: string[]; // Areas user needs help with
  recentQuestions: string[]; // Last 20 questions asked
  notes: string; // Custom notes about the user
  lastUpdated: Date;
}

// User Role Types
export type UserRole = 'student' | 'professor';

// Course Types
export interface Course {
  id: string;
  name: string;
  description?: string;
  professorId: string; // User ID of the professor who created it
  professorName: string;
  createdAt: Date;
  updatedAt: Date;
  fileIds: string[]; // File IDs associated with this course
  isVisible: boolean; // Whether students can see and select this course
}

export interface CourseFile {
  courseId: string;
  fileId: string;
  fileName: string;
  uploadedAt: Date;
}

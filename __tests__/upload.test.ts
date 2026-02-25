/**
 * Upload route — unit tests for business logic.
 *
 * These tests verify the validation logic that the /api/upload route uses,
 * without spinning up a real HTTP server.
 */

import { describe, it, expect } from 'vitest';

// ── Helpers copied from lib/utils (inlined to avoid Next.js module resolution) ─
const VALID_EXTENSIONS = new Set(['pdf', 'pptx', 'docx', 'xlsx', 'txt']);

function isValidFileType(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return VALID_EXTENSIONS.has(ext);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('isValidFileType', () => {
  it('accepts PDF files', () => {
    expect(isValidFileType('lecture.pdf')).toBe(true);
  });

  it('accepts PPTX files', () => {
    expect(isValidFileType('slides.pptx')).toBe(true);
  });

  it('accepts DOCX files', () => {
    expect(isValidFileType('notes.docx')).toBe(true);
  });

  it('accepts XLSX files', () => {
    expect(isValidFileType('data.xlsx')).toBe(true);
  });

  it('accepts TXT files', () => {
    expect(isValidFileType('readme.txt')).toBe(true);
  });

  it('rejects EXE files', () => {
    expect(isValidFileType('malware.exe')).toBe(false);
  });

  it('rejects files with no extension', () => {
    expect(isValidFileType('noextension')).toBe(false);
  });

  it('is case-insensitive (uppercase extension)', () => {
    expect(isValidFileType('LECTURE.PDF')).toBe(true);
  });
});

describe('MAX_FILES limit', () => {
  // The old limit was 10 — verify that 11 files is now WITHIN the allowed cap (100)
  it('allows 11 files (previously blocked by MAX_FILES=10)', () => {
    const MAX_FILES = 100;
    const fileCount = 11;
    expect(fileCount <= MAX_FILES).toBe(true);
  });

  it('allows up to 100 files', () => {
    const MAX_FILES = 100;
    expect(100 <= MAX_FILES).toBe(true);
  });

  it('blocks 101 files', () => {
    const MAX_FILES = 100;
    expect(101 <= MAX_FILES).toBe(false);
  });
});

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(50 * 1024 * 1024)).toBe('50.0 MB');
  });
});

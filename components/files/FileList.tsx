"use client";

import { useState, useEffect } from 'react';
import { FileMetadata } from '@/types';
import { FileItem } from './FileItem';
import { FileUpload } from './FileUpload';
import { Loader2, FolderOpen, MessageSquare, ArrowRight, Upload } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getUserRole, getCourse } from '@/lib/course-management';

interface FileListProps {
  onFilesChange?: () => void;
  courseId?: string;
}

export function FileList({ onFilesChange, courseId }: FileListProps) {
  const userRole = getUserRole();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; url?: string; name: string } | null>(null);
  const [course, setCourse] = useState<Awaited<ReturnType<typeof getCourse>> | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      console.log('[FileList] Loading files...', courseId ? `(course: ${courseId})` : '');
      
      // Get file IDs for the course if courseId is provided
      let url = '/api/files';
      if (courseId) {
        const { getCourseFiles } = await import('@/lib/course-management');
        const courseFiles = await getCourseFiles(courseId);
        const fileIds = courseFiles.map(cf => cf.fileId);
        if (fileIds.length > 0) {
          url = `/api/files?fileIds=${fileIds.join(',')}`;
        }
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[FileList] Failed to load files:', response.status, errorText);
        throw new Error(`Failed to load files: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[FileList] Files loaded:', data.files?.length || 0);
      
      // Convert date strings back to Date objects
      const filesWithDates = (data.files || []).map((file: any) => ({
        ...file,
        uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : new Date(),
      }));
      setFiles(filesWithDates);
    } catch (error) {
      console.error('[FileList] Error loading files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load files';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
    if (courseId) {
      getCourse(courseId).then(setCourse);
    } else {
      setCourse(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]); // Reload when courseId changes

  const handleDeleteRequest = (fileId: string, fileUrl?: string) => {
    const file = files.find(f => f.id === fileId);
    setDeleteConfirm({ id: fileId, url: fileUrl, name: file?.name || 'this file' });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    const { id: fileId, url: fileUrl } = deleteConfirm;
    setDeleteConfirm(null);
    setDeleting(fileId);
    
    try {
      console.log('[FileList] Deleting file:', { fileId, fileUrl });
      
      // Also pass the URL if available (for more reliable deletion)
      const params = new URLSearchParams({ id: fileId });
      if (fileUrl) {
        params.append('url', fileUrl);
      }
      const response = await fetch(`/api/files?${params.toString()}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorText = errorData.error || errorData.details || 'Unknown error';
        console.error('[FileList] Delete failed:', response.status, errorText);
        throw new Error(`Failed to delete file: ${errorText}`);
      }

      console.log('[FileList] ✅ File deleted successfully:', fileId);
      
      // Remove from local state immediately
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      
      // Reload files from server to ensure consistency
      await loadFiles();
      
      toast({
        title: 'File Deleted',
        description: 'The file has been removed from your materials',
        variant: 'success',
      });
      
      // Notify parent component
      onFilesChange?.();
    } catch (error) {
      console.error('[FileList] ❌ Error deleting file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 text-[#57068C] dark:text-purple-400">
          {course ? `${course.name} - Materials` : 'Course Materials'}
        </h2>
        <p className="text-muted-foreground text-lg">
          {course 
            ? `Upload and manage files for ${course.name}. The AI will use these materials to provide accurate, course-specific answers.`
            : 'Upload your course files (PDF, PPTX, DOCX, XLSX, TXT) from any NYU course. The AI will use these materials to provide accurate, course-specific answers.'}
        </p>
      </div>

      {userRole === 'professor' && courseId && (
        <FileUpload 
          courseId={courseId}
          courseName={course?.name}
          onUploadComplete={() => {
            loadFiles();
            onFilesChange?.();
          }} 
        />
      )}
      {userRole === 'professor' && !courseId && (
        <Card className="p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Select a Course to Upload Materials
          </p>
          <p className="text-sm text-muted-foreground">
            Please create or select a course above before uploading files
          </p>
        </Card>
      )}

      {/* Quick Action: Go to Chat */}
      {files.length > 0 && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => {
              if (typeof window !== 'undefined') {
                const event = new CustomEvent('go-to-chat');
                window.dispatchEvent(event);
              }
            }}
            className="bg-[#57068C] hover:bg-[#6A0BA8] text-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Start Chatting
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {files.length} file(s) • {formatFileSize(totalSize)} total
            </p>
          </div>
          <div className="space-y-3">
            {files.map((file) => (
              <FileItem
                key={file.id}
                file={file}
                onDelete={handleDeleteRequest}
                isDeleting={deleting === file.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete File?"
        description={`Are you sure you want to delete "${deleteConfirm?.name}"? The AI will no longer be able to reference this material.`}
        confirmText="Delete"
        type="danger"
        icon="trash"
      />
    </div>
  );
}

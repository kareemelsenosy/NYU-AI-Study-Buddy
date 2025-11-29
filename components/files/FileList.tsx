"use client";

import { useState, useEffect } from 'react';
import { FileMetadata } from '@/types';
import { FileItem } from './FileItem';
import { FileUpload } from './FileUpload';
import { Loader2, FolderOpen, MessageSquare, ArrowRight } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { formatFileSize } from '@/lib/utils';

interface FileListProps {
  onFilesChange?: () => void;
}

export function FileList({ onFilesChange }: FileListProps) {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      console.log('[FileList] Loading files...');
      const response = await fetch('/api/files');
      
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
  }, []);

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    setDeleting(fileId);
    try {
      console.log('[FileList] Deleting file:', fileId);
      const response = await fetch(`/api/files?id=${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[FileList] Delete failed:', response.status, errorText);
        throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[FileList] File deleted successfully:', fileId);
      
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast({
        title: 'Success',
        description: 'File deleted successfully',
        variant: 'success',
      });
      onFilesChange?.();
    } catch (error) {
      console.error('[FileList] Error deleting file:', error);
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
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-[#57068C] to-[#8B2FC9] bg-clip-text text-transparent">
          Course Materials
        </h2>
        <p className="text-muted-foreground text-lg">
          Upload your course files (PDF, PPTX, DOCX, XLSX, TXT) from any NYU course. The AI will use these materials to provide accurate, course-specific answers.
        </p>
      </div>

      <FileUpload onUploadComplete={() => {
        loadFiles();
        onFilesChange?.();
      }} />

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
            className="bg-gradient-to-r from-[#57068C] to-[#8B2FC9] hover:from-[#6A0BA8] hover:to-[#9D3FD9] text-white"
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
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



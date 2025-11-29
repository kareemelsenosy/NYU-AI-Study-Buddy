"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatFileSize, isValidFileType } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (!isValidFileType(file.name)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not supported. Supported: PDF, PPTX, DOCX, XLSX, TXT`,
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      console.warn('[FileUpload] No files selected');
      return;
    }

    console.log('[FileUpload] Starting upload of', selectedFiles.length, 'file(s)');
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      console.log(`[FileUpload] Adding file ${index + 1}:`, file.name, formatFileSize(file.size));
      formData.append('files', file);
    });

    try {
      console.log('[FileUpload] Sending request to /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      console.log('[FileUpload] Response status:', response.status, response.statusText);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not JSON, create error object
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`Server error: ${response.status} ${response.statusText}. ${text}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `Upload failed: ${response.status} ${response.statusText}`);
      }

      if (data.success) {
        console.log('[FileUpload] Upload successful:', data.files?.length || 0, 'files');
        // Convert date strings to Date objects
        const filesWithDates = (data.files || []).map((file: any) => ({
          ...file,
          uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : new Date(),
        }));
        
        toast({
          title: 'Success',
          description: `Uploaded ${filesWithDates.length} file(s) successfully`,
          variant: 'success',
        });
        setSelectedFiles([]);
        onUploadComplete?.();
      } else {
        console.error('[FileUpload] Upload failed:', data.error);
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Upload failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-[#57068C] bg-[#57068C]/10 dark:bg-[#57068C]/20 shadow-lg scale-[1.02]' 
              : 'border-purple-300 dark:border-purple-700 hover:border-[#57068C] hover:bg-purple-50/50 dark:hover:bg-purple-950/30'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className="flex items-center justify-center mb-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-[#57068C]' : 'bg-purple-100 dark:bg-purple-900'}`}>
              <Upload className={`h-8 w-8 ${isDragActive ? 'text-white' : 'text-[#57068C]'}`} />
            </div>
          </div>
          <p className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-base text-muted-foreground mb-4">
            or <span className="text-[#57068C] font-medium">click to browse</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Supported formats: PDF, PPTX, DOCX, XLSX, TXT • Max 50MB per file
          </p>
        </div>
      </Card>

      {selectedFiles.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white shadow-lg h-12 text-base font-semibold"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Uploading {selectedFiles.length} file(s)...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Upload {selectedFiles.length} file(s)
              </>
            )}
          </Button>
        </Card>
      )}
    </div>
  );
}



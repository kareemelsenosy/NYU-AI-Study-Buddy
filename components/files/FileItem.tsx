"use client";

import { FileMetadata } from '@/types';
import { File, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize, formatDate, getFileType } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface FileItemProps {
  file: FileMetadata;
  onDelete: (id: string) => void;
}

export function FileItem({ file, onDelete }: FileItemProps) {
  const fileType = getFileType(file.name);

  return (
    <Card className="p-5 hover:shadow-lg transition-all border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-800">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center shadow-md">
          <File className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-base truncate text-gray-900 dark:text-gray-100">{file.name}</h4>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium uppercase text-xs">
              {fileType}
            </span>
            <span>•</span>
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(file.url, '_blank');
              }
            }}
            className="h-8 w-8"
            aria-label="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(file.id)}
            className="h-8 w-8 text-destructive hover:text-destructive"
            aria-label="Delete file"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}



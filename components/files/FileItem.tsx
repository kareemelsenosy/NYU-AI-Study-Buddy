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
  const fileTypeColors: Record<string, string> = {
    pdf: 'text-red-500',
    pptx: 'text-orange-500',
    docx: 'text-blue-500',
    xlsx: 'text-green-500',
    txt: 'text-gray-500',
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${fileTypeColors[fileType] || 'text-gray-500'}`}>
          <File className="h-8 w-8" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{file.name}</h4>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.uploadedAt)}</span>
            <span>•</span>
            <span className="uppercase">{fileType}</span>
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



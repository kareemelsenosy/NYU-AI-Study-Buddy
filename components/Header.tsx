"use client";

import { Button } from '@/components/ui/button';
import { FolderOpen, Moon, Sun, HelpCircle, MessageSquare, Upload } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface HeaderProps {
  onFileManagerClick?: () => void;
  onHelpClick?: () => void;
  onChatClick?: () => void;
  onHomeClick?: () => void;
}

export function Header({ onFileManagerClick, onHelpClick, onChatClick, onHomeClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-gray-900/80 shadow-sm">
      <div className="container flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onHomeClick}>
            <div>
              <h1 className="text-2xl font-bold text-purple-700 dark:text-purple-500 leading-normal pb-0.5">
                NYU AI Study Buddy
              </h1>
              <p className="text-xs text-muted-foreground font-medium">
                Your Intelligent Academic Assistant
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onChatClick}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/20"
            aria-label="Go to Chat"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">Chat</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onFileManagerClick}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/20"
            aria-label="Upload Materials"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden md:inline">Upload</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelpClick}
            className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-purple-50 dark:hover:bg-purple-950/20"
            aria-label="Help & Instructions"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden md:inline">How It Works</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}



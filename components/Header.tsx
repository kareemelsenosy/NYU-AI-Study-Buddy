"use client";

import { Button } from '@/components/ui/button';
import { Moon, Sun, HelpCircle, MessageSquare, Upload, Settings, Sparkles, BookOpen, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { ModelSelector } from './ModelSelector';
import { UserMenu } from './auth/UserMenu';
import { User, UserRole } from '@/types';

interface HeaderProps {
  onFileManagerClick?: () => void;
  onHelpClick?: () => void;
  onChatClick?: () => void;
  onHomeClick?: () => void;
  onSettingsClick?: () => void;
  onModelChange?: (modelId: string) => void;
  onProfessorToolsClick?: () => void;
  user?: User | null;
  userRole?: UserRole | null;
  onSignInClick?: () => void;
  onProfileClick?: () => void;
  onSignOut?: () => void;
}

export function Header({
  onFileManagerClick,
  onHelpClick,
  onChatClick,
  onHomeClick,
  onSettingsClick,
  onModelChange,
  onProfessorToolsClick,
  user,
  userRole,
  onSignInClick,
  onProfileClick,
  onSignOut,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Only show role-specific buttons if user is signed in AND has a role selected
  const isProfessor = user && userRole === 'professor';
  const isStudent = user && userRole === 'student';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={onHomeClick}
          >
            {/* Logo Mark */}
            <div className="w-9 h-9 bg-gradient-to-br from-[#57068C] to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-all duration-300 group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                NYU AI Study Buddy
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onChatClick}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                {isStudent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onFileManagerClick}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Select Course
                  </Button>
                )}
                {isProfessor && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onFileManagerClick}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Materials
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onProfessorToolsClick}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Professor Tools
                    </Button>
                  </>
                )}
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onHelpClick}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </Button>
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Model Selector */}
          <div className="hidden sm:block">
            <ModelSelector onModelChange={onModelChange} />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

          {/* User Menu */}
          <UserMenu
            user={user || null}
            onSignInClick={onSignInClick || (() => {})}
            onProfileClick={onProfileClick || (() => {})}
            onSignOut={onSignOut || (() => {})}
          />

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Settings"
          >
            <Settings className="h-[18px] w-[18px]" />
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {mounted && theme === 'dark' ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}

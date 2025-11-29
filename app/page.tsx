"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { FileList } from '@/components/files/FileList';
import { WelcomeSection } from '@/components/WelcomeSection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, MessageSquare, ArrowRight } from 'lucide-react';

export default function Home() {
  const [showFileManager, setShowFileManager] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasFiles, setHasFiles] = useState(false);

  // Check if user has files (but don't auto-show chat on reload)
  useEffect(() => {
    const checkFiles = async () => {
      try {
        const response = await fetch('/api/files');
        if (response.ok) {
          const data = await response.json();
          if (data.files && data.files.length > 0) {
            setHasFiles(true);
            // Don't auto-show chat - keep welcome page on reload
          }
        }
      } catch (error) {
        console.error('[Home] Error checking files:', error);
      }
    };
    checkFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for go-to-chat event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleGoToChatEvent = () => {
      handleGoToChat();
    };

    window.addEventListener('go-to-chat' as any, handleGoToChatEvent);
    return () => {
      window.removeEventListener('go-to-chat' as any, handleGoToChatEvent);
    };
  }, []);

  const handleGetStarted = () => {
    setShowFileManager(true);
    setShowWelcome(false);
    setShowHelp(false);
  };

  const handleGoToChat = () => {
    setShowFileManager(false);
    setShowHelp(false);
    setShowWelcome(false);
  };

  const handleGoToUpload = () => {
    setShowFileManager(true);
    setShowHelp(false);
    setShowWelcome(false);
  };

  const handleGoToHome = () => {
    setShowFileManager(false);
    setShowHelp(false);
    setShowWelcome(true);
  };

  const handleCloseModal = () => {
    setShowHelp(false);
    setShowFileManager(false);
    // If no files, show welcome; otherwise show chat
    if (!hasFiles) {
      setShowWelcome(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header 
        onFileManagerClick={handleGoToUpload}
        onHelpClick={() => setShowHelp(true)}
        onChatClick={handleGoToChat}
        onHomeClick={handleGoToHome}
      />
      
      <main className="flex-1 overflow-hidden relative">
        {/* Help Modal */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex items-center justify-between z-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                  How It Works
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  className="rounded-full"
                  aria-label="Close help"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-8">
                <WelcomeSection onGetStarted={handleGetStarted} />
              </div>
            </Card>
          </div>
        )}

        {/* File Manager Modal */}
        {showFileManager && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                    Course Materials
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Upload and manage your course files
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGoToChat}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Go to Chat
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCloseModal}
                    className="rounded-full"
                    aria-label="Close file manager"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <FileList
                  onFilesChange={() => {
                    setHasFiles(true);
                  }}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Main Content - Only show when modals are closed */}
        {!showHelp && !showFileManager && (
          showWelcome ? (
            <div className="h-full overflow-auto">
              <div className="min-h-full flex items-center justify-center py-12">
                <WelcomeSection onGetStarted={handleGetStarted} />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col max-w-5xl mx-auto w-full" style={{ height: '100%', minHeight: 0 }}>
              <div className="flex-1 min-h-0 overflow-hidden p-6" style={{ height: '100%', minHeight: 0 }}>
                <ChatInterface />
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}



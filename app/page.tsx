"use client";

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { FileList } from '@/components/files/FileList';
import { WelcomeSection } from '@/components/WelcomeSection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, MessageSquare, SidebarOpen, SidebarClose, Upload } from 'lucide-react';
import { downloadChatAsText, printChat } from '@/lib/chat-export';
import { createNewChatSession, deleteChatSession } from '@/lib/chat-history';
import { getSelectedModel } from '@/lib/models';
import { toast } from '@/components/ui/toast';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserProfile } from '@/components/auth/UserProfile';
import { SettingsModal } from '@/components/SettingsModal';
import { HelpContent } from '@/components/HelpContent';
import { getCurrentUser } from '@/lib/user-auth';
import { User, UserRole } from '@/types';
import { getUserRole, setUserRole as saveUserRole, getSelectedCourseId } from '@/lib/course-management';
import { CourseSelector } from '@/components/CourseSelector';
import { CourseManager } from '@/components/CourseManager';
import { ProfessorAnalytics } from '@/components/professor/ProfessorAnalytics';

export default function Home() {
  const [showFileManager, setShowFileManager] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasFiles, setHasFiles] = useState(false);
  const [currentChatSessionId, setCurrentChatSessionId] = useState<string | null>(null);
  const [showChatSidebar, setShowChatSidebar] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [chatKey, setChatKey] = useState(0); // Used to force ChatInterface to reset
  
  // User authentication state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Role management
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  
  // Professor analytics
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Initialize selected model, user, and role on mount
  useEffect(() => {
    setSelectedModel(getSelectedModel());
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      // Load role from user account if available
      if (currentUser.role) {
        saveUserRole(currentUser.role);
        setUserRole(currentUser.role);
      }
    }
    
    // Check for role
    const role = getUserRole();
    if (role) {
      setUserRole(role);
      const courseId = getSelectedCourseId();
      setSelectedCourseId(courseId);
    }

    // Listen for role changes
    const handleRoleChange = () => {
      const newRole = getUserRole();
      setUserRole(newRole);
    };
    window.addEventListener('role-change', handleRoleChange);
    return () => window.removeEventListener('role-change', handleRoleChange);
  }, []);

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
  };

  // Check if user has files (but don't auto-show chat on reload)
  useEffect(() => {
    const checkFiles = async () => {
      try {
        const response = await fetch('/api/files');
        if (response.ok) {
          const data = await response.json();
          if (data.files && data.files.length > 0) {
            setHasFiles(true);
          }
        }
      } catch (error) {
        console.error('[Home] Error checking files:', error);
      }
    };
    checkFiles();
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
    // Different behavior based on role
    if (userRole === 'professor') {
      // Professors go to course management
      setShowFileManager(true);
      setShowWelcome(false);
      setShowHelp(false);
      setShowAnalytics(false);
    } else if (userRole === 'student') {
      // Students go to course selection
      setShowFileManager(true);
      setShowWelcome(false);
      setShowHelp(false);
      setShowAnalytics(false);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleGoToChat = () => {
    setShowFileManager(false);
    setShowHelp(false);
    setShowWelcome(false);
    setShowAnalytics(false);
    // Don't create a session - just go to chat view
    // Session will be created when user sends first message
  };
  
  const handleOpenAnalytics = () => {
    // Open analytics modal without changing the underlying view
    setShowAnalytics(true);
  };

  const handleNewChat = () => {
    // Clear current session - new one will be created on first message
    setCurrentChatSessionId(null);
    setChatKey(prev => prev + 1); // Force ChatInterface to reset
    setShowWelcome(false);
    setShowFileManager(false);
    setShowHelp(false);
  };

  const handleSelectSession = (sessionId: string) => {
    setCurrentChatSessionId(sessionId);
    setShowWelcome(false);
    setShowFileManager(false);
    setShowHelp(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteChatSession(sessionId);
    toast({
      title: 'Chat Deleted',
      description: 'The chat has been deleted successfully.',
      variant: 'success',
    });
    // If we deleted the current chat, just clear it (don't create new one)
    if (currentChatSessionId === sessionId) {
      setCurrentChatSessionId(null);
    }
  };

  const handleExportChat = (sessionId: string) => {
    downloadChatAsText(sessionId);
  };

  const handlePrintChat = (sessionId: string) => {
    printChat(sessionId);
  };

  const handleGoToUpload = () => {
    // Different behavior based on role
    if (userRole === 'professor') {
      // Professors go to file manager to upload materials
      setShowFileManager(true);
      setShowHelp(false);
      setShowWelcome(false);
    } else if (userRole === 'student') {
      // Students go to course selection
      setShowFileManager(true);
      setShowHelp(false);
      setShowWelcome(false);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleGoToHome = () => {
    setShowFileManager(false);
    setShowHelp(false);
    setShowWelcome(true);
  };

  const handleCloseModal = () => {
    setShowHelp(false);
    setShowFileManager(false);
    // Don't change the view when closing modals
    // Just close the modal and stay on current view
  };

  // Auth handlers
  const handleAuthSuccess = (newUser: User) => {
    setUser(newUser);
  };

  const handleUserUpdate = (updatedUser: User | null) => {
    setUser(updatedUser);
  };

  const handleSignOut = () => {
    setUser(null);
    saveUserRole(null);
    setUserRole(null);
  };

  // Listen for auth modal open event
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleOpenAuth = () => setShowAuthModal(true);
    window.addEventListener('open-auth-modal' as any, handleOpenAuth);
    return () => window.removeEventListener('open-auth-modal' as any, handleOpenAuth);
  }, []);

  const handleCourseSelected = (courseId: string) => {
    setSelectedCourseId(courseId);
    // For students, go to chat when course is selected
    if (userRole === 'student') {
      handleGoToChat();
    }
  };

  const handleCourseCreated = (courseId: string) => {
    setSelectedCourseId(courseId);
    // For professors, show file manager after creating course
    if (userRole === 'professor') {
      setShowFileManager(true);
      setShowWelcome(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Header 
        onFileManagerClick={handleGoToUpload}
        onHelpClick={() => setShowHelp(true)}
        onChatClick={handleGoToChat}
        onHomeClick={handleGoToHome}
        onSettingsClick={() => setShowSettingsModal(true)}
        onModelChange={handleModelChange}
        user={user}
        userRole={userRole}
        onSignInClick={() => setShowAuthModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        onSignOut={handleSignOut}
      />
      
      <main className="flex-1 overflow-hidden relative">
        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={(newUser) => {
            handleAuthSuccess(newUser);
            if (newUser.role) {
              saveUserRole(newUser.role);
              setUserRole(newUser.role);
            }
          }}
        />

        {/* Profile Modal */}
        {user && (
          <UserProfile
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            user={user}
            onUserUpdate={handleUserUpdate}
          />
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
        />

        {/* Help Modal */}
        {showHelp && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <Card 
              className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-5 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    How It Works
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Everything you need to know
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  className="rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close help"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-88px)]">
                <HelpContent 
                  user={user}
                  role={userRole}
                  onGetStarted={() => {
                    handleCloseModal();
                    handleGetStarted();
                  }} 
                  onStartChat={() => {
                    handleCloseModal();
                    handleGoToChat();
                  }}
                  onViewAnalytics={userRole === 'professor' ? () => {
                    if (!user) {
                      handleCloseModal();
                      setShowAuthModal(true);
                      return;
                    }
                    handleCloseModal();
                    handleOpenAnalytics();
                  } : undefined}
                />
              </div>
            </Card>
          </div>
        )}

        {/* File Manager Modal - For Professors */}
        {showFileManager && userRole === 'professor' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-3xl font-bold text-[#57068C] dark:text-purple-400">
                    Course Management
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Create courses and upload materials for your students
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
              <div className="p-6 space-y-6">
                {/* Course Manager */}
                <div>
                  <CourseManager 
                    onCourseCreated={handleCourseCreated}
                    onCourseSelected={(courseId) => {
                      setSelectedCourseId(courseId);
                    }}
                  />
                </div>
                {/* File List for Selected Course */}
                <div className="border-t pt-6">
                  <FileList
                    courseId={selectedCourseId || undefined}
                    onFilesChange={() => {
                      setHasFiles(true);
                    }}
                  />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Course Selection Modal - For Students */}
        {showFileManager && userRole === 'student' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 shadow-2xl">
              <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-3xl font-bold text-[#57068C] dark:text-purple-400">
                    Select Course
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Choose a course to start asking questions
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseModal}
                  className="rounded-full"
                  aria-label="Close course selector"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="p-6">
                <CourseSelector onCourseSelected={handleCourseSelected} />
              </div>
            </Card>
          </div>
        )}

        {/* Professor Analytics Modal - Always render above other content */}
        {showAnalytics && (
          <ProfessorAnalytics
            isOpen={showAnalytics}
            onClose={() => setShowAnalytics(false)}
          />
        )}

        {/* Main Content */}
        {showWelcome && !showHelp && !showFileManager && !showAnalytics ? (
          <div className="h-full overflow-auto">
            <div className="min-h-full flex items-center justify-center py-12">
              <WelcomeSection 
                user={user}
                role={userRole}
                onGetStarted={() => {
                  if (!user) {
                    setShowAuthModal(true);
                  } else {
                    handleGetStarted();
                  }
                }}
                onViewAnalytics={() => {
                  const currentRole = getUserRole();
                  if (!currentRole || currentRole !== 'professor') {
                    toast({
                      title: 'Professor Access Only',
                      description: 'Analytics are only available for professors',
                    });
                    return;
                  }
                  if (!user) {
                    setShowAuthModal(true);
                    return;
                  }
                  handleOpenAnalytics();
                }}
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex" style={{ height: '100%', minHeight: 0 }}>
            {/* Chat Sidebar */}
            {showChatSidebar && (
              <div className="hidden md:block">
                <ChatSidebar
                  currentSessionId={currentChatSessionId}
                  onSelectSession={handleSelectSession}
                  onNewChat={handleNewChat}
                  onDeleteSession={handleDeleteSession}
                  onExportChat={handleExportChat}
                  onPrintChat={handlePrintChat}
                />
              </div>
            )}
            
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col min-w-0" style={{ height: '100%', minHeight: 0 }}>
              {/* Sidebar Toggle */}
              <div className="p-2 border-b border-purple-200 dark:border-purple-800 flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowChatSidebar(!showChatSidebar)}
                  className="md:hidden"
                  title="Toggle Sidebar"
                >
                  {showChatSidebar ? <SidebarClose className="h-5 w-5" /> : <SidebarOpen className="h-5 w-5" />}
                </Button>
                {showChatSidebar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChatSidebar(false)}
                    className="hidden md:flex"
                    title="Hide Sidebar"
                  >
                    <SidebarClose className="h-5 w-5" />
                  </Button>
                )}
                {!showChatSidebar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowChatSidebar(true)}
                    className="hidden md:flex"
                    title="Show Sidebar"
                  >
                    <SidebarOpen className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 min-h-0 overflow-hidden p-6" style={{ height: '100%', minHeight: 0 }}>
                <ChatInterface 
                  key={chatKey}
                  sessionId={currentChatSessionId}
                  onSessionChange={setCurrentChatSessionId}
                  selectedModel={selectedModel}
                  onModelChange={handleModelChange}
                  user={user}
                />
              </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            {showChatSidebar && (
              <div className="md:hidden fixed inset-0 z-40">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowChatSidebar(false)} />
                <div className="absolute left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900">
                  <ChatSidebar
                    currentSessionId={currentChatSessionId}
                    onSelectSession={(id) => {
                      handleSelectSession(id);
                      setShowChatSidebar(false);
                    }}
                    onNewChat={() => {
                      handleNewChat();
                      setShowChatSidebar(false);
                    }}
                    onDeleteSession={handleDeleteSession}
                    onExportChat={handleExportChat}
                    onPrintChat={handlePrintChat}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

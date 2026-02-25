"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Message as MessageType, ChatSession, User } from '@/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { generateId } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import { 
  getChatSession, 
  saveChatSession, 
  generateChatTitle,
  createNewChatSession,
} from '@/lib/chat-history';
import { getSelectedModel } from '@/lib/models';
import { addRecentQuestion, addStudiedTopic, learnFromConversation } from '@/lib/user-auth';
import { getSelectedCourseId, getCourseFiles } from '@/lib/course-management';

interface ChatInterfaceProps {
  sessionId?: string | null;
  onSessionChange?: (sessionId: string) => void;
  selectedModel?: string;
  onModelChange?: (modelId: string) => void;
  user?: User | null;
  courseId?: string | null;               // Active course to associate with the session
  onOpenAuthModal?: () => void;           // Replaces window event
  pendingQuestion?: string | null;        // Example question to send automatically
  onPendingQuestionConsumed?: () => void; // Clears the pending question in parent
}

const SESSION_STORAGE_KEY = 'nyu-study-buddy-current-session';

export function ChatInterface({ sessionId, onSessionChange, selectedModel, onModelChange, user, courseId, onOpenAuthModal, pendingQuestion, onPendingQuestionConsumed }: ChatInterfaceProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(sessionId || null);
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<MessageType[]>([]);
  const messagesRef = useRef<MessageType[]>([]); // Ref to track current messages for saving
  
  // Get the current model (from prop or localStorage)
  const getCurrentModel = useCallback(() => {
    return selectedModel || getSelectedModel();
  }, [selectedModel]);

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      // Load existing session
      loadSession(sessionId);
    } else if (sessionId === null) {
      // Session was cleared (new chat clicked) - just clear messages, don't create new session
      clearChat();
    }
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSession = async (id: string) => {
    const session = await getChatSession(id);
    if (session) {
      setCurrentSessionId(id);
      setMessages(session.messages);
      messagesRef.current = session.messages;
      setConversationHistory(session.messages);
    }
  };

  const clearChat = () => {
    // Clear messages but don't create a session yet
    setCurrentSessionId(null);
    setMessages([]);
    messagesRef.current = [];
    setConversationHistory([]);
  };

  const createSessionIfNeeded = async (): Promise<string> => {
    // Only create a session when actually needed (first message)
    if (!currentSessionId) {
      const newSession = await createNewChatSession(undefined, user?.id);
      setCurrentSessionId(newSession.id);
      // Persist session ID so refresh restores the same session
      if (typeof window !== 'undefined') {
        localStorage.setItem(SESSION_STORAGE_KEY, newSession.id);
      }
      onSessionChange?.(newSession.id);
      return newSession.id;
    }
    return currentSessionId;
  };

  const handleSend = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Block chat if user is not signed in
    if (!user) {
      toast({
        title: 'Sign In Required',
        description: 'Please sign in to use the chat feature',
        variant: 'destructive',
      });
      return;
    }

    // Create session on first message (like ChatGPT)
    const activeSessionId = await createSessionIfNeeded();

    const userMessage: MessageType = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      messagesRef.current = updated;
      return updated;
    });
    setConversationHistory((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      console.log('[ChatInterface] Sending message:', message.substring(0, 50) + '...');
      console.log('[ChatInterface] Session ID:', activeSessionId);
      
      const currentModel = getCurrentModel();
      console.log('[ChatInterface] Using model:', currentModel);
      
      // Track user's question if logged in
      if (user) {
        addRecentQuestion(message);
        // Extract potential topics from the question
        const topicKeywords = message.toLowerCase().match(/\b(chapter|lecture|topic|unit|module|section)\s*\d*\s*[:\-]?\s*(\w+)/gi);
        if (topicKeywords) {
          topicKeywords.forEach(topic => addStudiedTopic(topic.trim()));
        }
      }
      
      // Get course file IDs if a course is selected
      const courseId = getSelectedCourseId();
      const courseFileList = courseId ? await getCourseFiles(courseId) : [];
      const fileIds = courseFileList.length > 0 ? courseFileList.map(cf => cf.fileId) : undefined;

      // Track question for analytics (if course is selected)
      if (courseId) {
        // Import and track asynchronously to not block the main flow
        import('@/lib/analytics').then(async ({ trackQuestion }) => {
          import('@/lib/course-management').then(async ({ getCourse }) => {
            const course = await getCourse(courseId);
            if (course) {
              trackQuestion(message, courseId, course.name, activeSessionId, user?.id);
            }
          });
        });
      }
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10),
          model: currentModel,
          courseId: courseId || undefined,
          fileIds: fileIds,
          user: user ? {
            name: user.name,
            preferences: user.preferences,
            memory: user.memory,
            role: user.role,
          } : null,
        }),
      });
      
      console.log('[ChatInterface] Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error('[ChatInterface] Response not OK:', response.status, response.statusText);
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('[ChatInterface] Error response text:', errorText);
          throw new Error(`HTTP ${response.status}: ${response.statusText}. ${errorText.substring(0, 200)}`);
        }
        console.error('[ChatInterface] Error data:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: MessageType = {
        id: generateId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                setIsTyping(false);
                setConversationHistory((prev) => [...prev, assistantMessage]);
                
                // Learn from the conversation (extract topics for memory)
                if (user && assistantMessage.content) {
                  learnFromConversation(message, assistantMessage.content);
                }
                
                // Save session after message completes with AI-generated title
                // Use ref to get latest messages to avoid stale closure
                setTimeout(async () => {
                  if (activeSessionId) {
                    const finalMessages = messagesRef.current;
                    const title = await generateChatTitle(finalMessages);
                    const session: ChatSession = {
                      id: activeSessionId,
                      title: title,
                      messages: finalMessages,
                      userId: user?.id,
                      courseId: courseId ?? undefined,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    };
                    saveChatSession(session);
                  }
                }, 500); // Slight delay to ensure message is fully saved
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.error) {
                  setIsTyping(false);
                  throw new Error(parsed.error);
                }
                if (parsed.content) {
                  assistantMessage.content += parsed.content;
                  setMessages((prev) => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { ...assistantMessage };
                    messagesRef.current = updated;
                    return updated;
                  });
                  // Trigger scroll after content update - multiple attempts
                  setTimeout(() => {
                    const messageList = document.querySelector('[data-message-list]') as HTMLElement;
                    if (messageList) {
                      messageList.scrollTop = messageList.scrollHeight;
                    }
                  }, 10);
                  setTimeout(() => {
                    const messageList = document.querySelector('[data-message-list]') as HTMLElement;
                    if (messageList) {
                      messageList.scrollTop = messageList.scrollHeight;
                    }
                  }, 100);
                }
              } catch (e) {
                if (e instanceof Error && e.message.includes('AI Error')) {
                  setIsTyping(false);
                  throw e;
                }
                // Skip invalid JSON for other cases
              }
            }
          }
        }
      }

      setIsTyping(false);
      setConversationHistory((prev) => [...prev, assistantMessage]);
      // Save session after message completes with AI-generated title
      // Use ref to get latest messages to avoid stale closure
      setTimeout(async () => {
        if (activeSessionId) {
          const finalMessages = messagesRef.current;
          const title = await generateChatTitle(finalMessages);
          const session: ChatSession = {
            id: activeSessionId,
            title: title,
            messages: finalMessages,
            userId: user?.id,
            courseId: courseId ?? undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          saveChatSession(session);
        }
      }, 500); // Slight delay to ensure message is fully saved
    } catch (error) {
      setIsTyping(false);
      console.error('[ChatInterface] Error in handleSend:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('[ChatInterface] Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // Show toast with error
      toast({
        title: 'Connection Error',
        description: errorMessage.includes('NYU AI Gateway') 
          ? 'Please connect to NYU VPN or campus network'
          : errorMessage,
        variant: 'destructive',
      });

      // Format error message for display
      let displayError = errorMessage;
      if (errorMessage.includes('NYU AI Gateway')) {
        displayError = errorMessage.replace(/\n\n/g, '\n').replace(/\n/g, '\n\n');
      }

      const errorMsg: MessageType = {
        id: generateId(),
        role: 'assistant',
        content: displayError,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const updated = [...prev, errorMsg];
        messagesRef.current = updated;
        return updated;
      });
    }
  }, [conversationHistory, getCurrentModel, messages, user, currentSessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle pending example question from parent (replaces window 'example-question' event)
  useEffect(() => {
    if (pendingQuestion) {
      handleSend(pendingQuestion);
      onPendingQuestionConsumed?.();
    }
  }, [pendingQuestion]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    setMessages([]);
    messagesRef.current = [];
    setConversationHistory([]);
    // Save empty session
    if (currentSessionId) {
      const session: ChatSession = {
        id: currentSessionId,
        title: 'New Chat',
        messages: [],
        userId: user?.id,
        courseId: courseId ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveChatSession(session);
    }
  };

  // Save session whenever messages change (debounced) with AI-generated title
  useEffect(() => {
    if (!currentSessionId || messages.length === 0) return;
    
    // Update ref whenever messages change
    messagesRef.current = messages;
    
    const timeoutId = setTimeout(async () => {
      // Use ref to get latest messages
      const currentMessages = messagesRef.current;
      const title = await generateChatTitle(currentMessages);
      const session: ChatSession = {
        id: currentSessionId,
        title: title,
        messages: currentMessages,
        userId: user?.id,
        courseId: courseId ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      saveChatSession(session);
    }, 2000); // Debounce saves by 2 seconds to allow AI title generation

    return () => clearTimeout(timeoutId);
  }, [messages, currentSessionId]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-gradient-to-b from-gray-50/50 to-white dark:from-gray-950 dark:to-gray-900" style={{ height: '100%' }}>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        <MessageList messages={messages} isTyping={isTyping} user={user} onExampleQuestion={handleSend} />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={isTyping}
        onModelChange={onModelChange}
        onSignInClick={() => {
          onOpenAuthModal?.();
        }}
      />
    </div>
  );
}

// Export for backward compatibility
export function ChatInterfaceWrapper() {
  return <ChatInterface />;
}



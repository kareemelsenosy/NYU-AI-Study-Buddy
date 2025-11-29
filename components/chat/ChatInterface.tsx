"use client";

import { useState, useEffect, useCallback } from 'react';
import { Message as MessageType } from '@/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { generateId } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<MessageType[]>([]);

  const handleSend = useCallback(async (message: string) => {
    if (!message.trim()) return;

    const userMessage: MessageType = {
      id: generateId(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setConversationHistory((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      console.log('[ChatInterface] Sending message:', message.substring(0, 50) + '...');
      console.log('[ChatInterface] Conversation history length:', conversationHistory.length);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationHistory.slice(-10),
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
    } catch (error) {
      setIsTyping(false);
      console.error('[ChatInterface] Error in handleSend:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      console.error('[ChatInterface] Error details:', {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });

      const errorMsg: MessageType = {
        id: generateId(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  }, [conversationHistory]);

  useEffect(() => {
    // Only add event listener on client side
    if (typeof window === 'undefined') return;

    const handleExampleQuestion = (e: CustomEvent) => {
      handleSend(e.detail);
    };

    window.addEventListener('example-question' as any, handleExampleQuestion);
    return () => {
      window.removeEventListener('example-question' as any, handleExampleQuestion);
    };
  }, [handleSend]);

  const handleClear = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ height: '100%' }}>
      <div className="flex-1 min-h-0 overflow-hidden" style={{ minHeight: 0, height: '100%' }}>
        <MessageList messages={messages} isTyping={isTyping} />
      </div>
      <MessageInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}



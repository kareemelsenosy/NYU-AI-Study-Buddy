"use client";

import { useState, useEffect } from 'react';
import { Message as MessageType } from '@/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { generateId } from '@/lib/utils';
import { toast } from '@/components/ui/toast';

export function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<MessageType[]>([]);

  useEffect(() => {
    const handleExampleQuestion = (e: CustomEvent) => {
      handleSend(e.detail);
    };

    window.addEventListener('example-question' as any, handleExampleQuestion);
    return () => {
      window.removeEventListener('example-question' as any, handleExampleQuestion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // handleSend is stable, no need to include in deps

  const handleSend = async (message: string) => {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
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
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
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
  };

  const handleClear = () => {
    setMessages([]);
    setConversationHistory([]);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} isTyping={isTyping} />
      </div>
      <MessageInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}



"use client";

import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '@/types';
import { 
  getAllChatSessions, 
  searchChatSessions,
  updateChatSessionTitle,
} from '@/lib/chat-history';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  Plus, 
  Trash2, 
  Search, 
  X,
  Edit2,
  Check,
  Download,
  Printer
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface ChatSidebarProps {
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onExportChat?: (sessionId: string) => void;
  onPrintChat?: (sessionId: string) => void;
  userId?: string;
}

export function ChatSidebar({
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onExportChat,
  onPrintChat,
  userId,
}: ChatSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const allSessions = searchQuery
      ? await searchChatSessions(searchQuery, userId)
      : await getAllChatSessions(userId);
    setSessions(allSessions);
  }, [searchQuery, userId]);

  useEffect(() => {
    loadSessions();
    const handleChange = () => loadSessions();
    window.addEventListener('storage', handleChange);
    window.addEventListener('chat-sessions-changed', handleChange);
    return () => {
      window.removeEventListener('storage', handleChange);
      window.removeEventListener('chat-sessions-changed', handleChange);
    };
  }, [searchQuery, loadSessions]);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(sessionId);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteSession(deleteConfirmId);
      loadSessions();
    }
    setDeleteConfirmId(null);
  };

  const handleEditStart = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleEditSave = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await updateChatSessionTitle(sessionId, editTitle.trim());
      setEditingId(null);
      loadSessions();
    }
  };

  const handleEditCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const handleExport = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onExportChat?.(sessionId);
  };

  const handlePrint = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    onPrintChat?.(sessionId);
  };

  return (
    <div className="w-80 border-r border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-purple-200 dark:border-purple-800">
        <Button
          onClick={onNewChat}
          className="w-full bg-[#57068C] hover:bg-[#6A0BA8] text-white mb-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {searchQuery ? 'No chats found' : 'No chat history'}
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Card
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                  currentSessionId === session.id
                    ? 'bg-purple-50 dark:bg-purple-950/20 border-[#57068C]'
                    : 'border-purple-200 dark:border-purple-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === session.id ? (
                      <div className="flex items-center gap-1 mb-1">
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(e as any, session.id);
                            } else if (e.key === 'Escape') {
                              handleEditCancel(e as any);
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => handleEditSave(e, session.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => handleEditCancel(e)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-sm truncate mb-1">
                        {session.title}
                      </h3>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(session.updatedAt)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  {editingId !== session.id && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={(e) => handleEditStart(e, session)}
                        title="Rename"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      {onExportChat && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => handleExport(e, session.id)}
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                      {onPrintChat && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={(e) => handlePrint(e, session.id)}
                          title="Print"
                        >
                          <Printer className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => handleDelete(e, session.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="Delete Chat?"
        description="This will permanently delete this conversation. This action cannot be undone."
        confirmText="Delete"
        type="danger"
        icon="trash"
      />
    </div>
  );
}


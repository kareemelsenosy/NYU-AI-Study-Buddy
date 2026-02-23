"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { X, Save, Trash2, Brain, GraduationCap, MessageSquare, LogOut, Zap } from 'lucide-react';
import { User, UserPreferences, UserMemory, UserRole } from '@/types';
import { updatePreferences, updateMemory, updateName, deleteAccount, signOut } from '@/lib/user-auth';
import { toast } from '@/components/ui/toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getUserRole } from '@/lib/course-management';
import { ProfessorTools } from '@/components/professor/ProfessorTools';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdate: (user: User | null) => void;
}

export function UserProfile({ isOpen, onClose, user, onUserUpdate }: UserProfileProps) {
  const userRole = getUserRole();
  const isProfessor = userRole === 'professor';
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'memory' | 'tools'>('profile');
  const [name, setName] = useState(user.name);
  const [preferences, setPreferences] = useState<UserPreferences>(user.preferences);
  const [memory, setMemory] = useState<UserMemory>(user.memory);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');
  
  // Confirmation modals
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSaveProfile = async () => {
    const updated = await updateName(name);
    if (updated) {
      const updatedWithPrefs = await updatePreferences(preferences);
      toast({ title: 'Saved', description: 'Profile updated successfully', variant: 'success' });
      onUserUpdate(updatedWithPrefs || updated);
    }
  };

  const handleSavePreferences = async () => {
    const updated = await updatePreferences(preferences);
    if (updated) {
      toast({ title: 'Saved', description: 'AI preferences updated', variant: 'success' });
      onUserUpdate(updated);
    }
  };

  const handleSaveMemory = async () => {
    const updated = await updateMemory(memory);
    if (updated) {
      toast({ title: 'Saved', description: 'Memory updated successfully', variant: 'success' });
      onUserUpdate(updated);
    }
  };

  const addStrength = () => {
    if (newStrength.trim() && !memory.strengths.includes(newStrength.trim())) {
      setMemory({ ...memory, strengths: [...memory.strengths, newStrength.trim()] });
      setNewStrength('');
    }
  };

  const addWeakness = () => {
    if (newWeakness.trim() && !memory.weaknesses.includes(newWeakness.trim())) {
      setMemory({ ...memory, weaknesses: [...memory.weaknesses, newWeakness.trim()] });
      setNewWeakness('');
    }
  };

  const handleSignOut = () => {
    signOut();
    onUserUpdate(null);
    onClose();
    toast({ title: 'Signed Out', description: 'You have been signed out', variant: 'success' });
  };

  const handleDeleteAccount = async () => {
    await deleteAccount();
    onUserUpdate(null);
    onClose();
    toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted', variant: 'success' });
  };

  const sections = [
    { id: 'profile', icon: GraduationCap, label: 'Profile' },
    { id: 'preferences', icon: MessageSquare, label: 'AI Style' },
    { id: 'memory', icon: Brain, label: 'Memory' },
    ...(isProfessor ? [{ id: 'tools', icon: Zap, label: 'Professor Tools' }] : []),
  ];

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        
        {/* Modal */}
        <Card 
          className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-gradient-to-br from-[#57068C] to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="rounded-full h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 px-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id as typeof activeTab)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-px ${
                  activeTab === section.id
                    ? 'border-[#57068C] text-[#57068C] dark:text-purple-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <section.icon className="h-4 w-4" />
                {section.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Display Name</label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#57068C] focus:ring-[#57068C]" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Email</label>
                  <Input 
                    value={user.email} 
                    disabled 
                    className="h-11 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700" 
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Email cannot be changed</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Major / Field of Study</label>
                  <Input
                    value={preferences.major}
                    onChange={(e) => setPreferences({ ...preferences, major: e.target.value })}
                    placeholder="e.g., Computer Science"
                    className="h-11 rounded-xl border-gray-200 dark:border-gray-700 focus:border-[#57068C] focus:ring-[#57068C]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Academic Level</label>
                  <select
                    value={preferences.academicLevel}
                    onChange={(e) => setPreferences({ ...preferences, academicLevel: e.target.value as UserPreferences['academicLevel'] })}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm focus:border-[#57068C] focus:ring-[#57068C] focus:outline-none"
                  >
                    <option value="freshman">Freshman</option>
                    <option value="sophomore">Sophomore</option>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="graduate">Graduate</option>
                  </select>
                </div>
                <Button onClick={handleSaveProfile} className="w-full h-11 rounded-xl bg-[#57068C] hover:bg-[#6A0BA8] shadow-lg shadow-purple-500/20">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </div>
            )}

            {/* AI Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-5">
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 mb-2">
                  <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Customize how the AI responds to you
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Learning Style</label>
                  <select
                    value={preferences.learningStyle}
                    onChange={(e) => setPreferences({ ...preferences, learningStyle: e.target.value as UserPreferences['learningStyle'] })}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm focus:border-[#57068C] focus:ring-[#57068C] focus:outline-none"
                  >
                    <option value="visual">Visual - Diagrams & charts</option>
                    <option value="auditory">Auditory - Verbal explanations</option>
                    <option value="reading">Reading/Writing - Text-based</option>
                    <option value="kinesthetic">Kinesthetic - Hands-on examples</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Response Style</label>
                  <select
                    value={preferences.responseStyle}
                    onChange={(e) => setPreferences({ ...preferences, responseStyle: e.target.value as UserPreferences['responseStyle'] })}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm focus:border-[#57068C] focus:ring-[#57068C] focus:outline-none"
                  >
                    <option value="concise">Concise - Brief answers</option>
                    <option value="detailed">Detailed - In-depth explanations</option>
                    <option value="step-by-step">Step-by-step - Numbered steps</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tone</label>
                  <select
                    value={preferences.tone}
                    onChange={(e) => setPreferences({ ...preferences, tone: e.target.value as UserPreferences['tone'] })}
                    className="w-full h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-sm focus:border-[#57068C] focus:ring-[#57068C] focus:outline-none"
                  >
                    <option value="formal">Formal - Academic</option>
                    <option value="casual">Casual - Friendly</option>
                    <option value="encouraging">Encouraging - Supportive</option>
                  </select>
                </div>
                <Button onClick={handleSavePreferences} className="w-full h-11 rounded-xl bg-[#57068C] hover:bg-[#6A0BA8] shadow-lg shadow-purple-500/20">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            )}

            {/* Memory Tab */}
            {activeTab === 'memory' && (
              <div className="space-y-5">
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-4 mb-2">
                  <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    The AI uses this to personalize responses
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Your Strengths</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newStrength}
                      onChange={(e) => setNewStrength(e.target.value)}
                      placeholder="e.g., Calculus, Python..."
                      onKeyDown={(e) => e.key === 'Enter' && addStrength()}
                      className="h-10 rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <Button onClick={addStrength} variant="outline" className="h-10 px-4 rounded-xl">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {memory.strengths.map((s, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-sm flex items-center gap-1.5 font-medium border border-emerald-200 dark:border-emerald-800"
                      >
                        {s}
                        <button 
                          onClick={() => setMemory({ ...memory, strengths: memory.strengths.filter((_, j) => j !== i) })} 
                          className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Areas to Improve</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      value={newWeakness}
                      onChange={(e) => setNewWeakness(e.target.value)}
                      placeholder="e.g., Organic Chemistry..."
                      onKeyDown={(e) => e.key === 'Enter' && addWeakness()}
                      className="h-10 rounded-xl border-gray-200 dark:border-gray-700"
                    />
                    <Button onClick={addWeakness} variant="outline" className="h-10 px-4 rounded-xl">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {memory.weaknesses.map((w, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full text-sm flex items-center gap-1.5 font-medium border border-amber-200 dark:border-amber-800"
                      >
                        {w}
                        <button 
                          onClick={() => setMemory({ ...memory, weaknesses: memory.weaknesses.filter((_, j) => j !== i) })} 
                          className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Notes for AI</label>
                  <textarea
                    value={memory.notes}
                    onChange={(e) => setMemory({ ...memory, notes: e.target.value })}
                    placeholder="Any other information the AI should know..."
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm min-h-[100px] resize-none focus:border-[#57068C] focus:ring-[#57068C] focus:outline-none"
                  />
                </div>

                {memory.topics.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Topics Studied</label>
                    <p className="text-xs text-gray-400 mb-2">Auto-detected from conversations</p>
                    <div className="flex flex-wrap gap-2">
                      {memory.topics.slice(-12).map((t, i) => (
                        <span key={i} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Button onClick={handleSaveMemory} className="w-full h-11 rounded-xl bg-[#57068C] hover:bg-[#6A0BA8] shadow-lg shadow-purple-500/20">
                  <Save className="h-4 w-4 mr-2" />
                  Save Memory
                </Button>
              </div>
            )}

            {/* Professor Tools Tab */}
            {activeTab === 'tools' && isProfessor && (
              <div className="max-h-[calc(85vh-250px)] overflow-y-auto">
                <ProfessorTools />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
            <Button 
              variant="ghost" 
              onClick={() => setShowSignOutConfirm(true)} 
              className="h-10 px-4 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setShowDeleteConfirm(true)} 
              className="h-10 px-4 rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </Card>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        description="This will permanently delete your account, preferences, and all saved data. This action cannot be undone."
        confirmText="Delete Account"
        type="danger"
        icon="trash"
      />

      <ConfirmModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out?"
        description="You'll need to sign in again to access your personalized settings and chat history."
        confirmText="Sign Out"
        type="warning"
        icon="logout"
      />
    </>
  );
}

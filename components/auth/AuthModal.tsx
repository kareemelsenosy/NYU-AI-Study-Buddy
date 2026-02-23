"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Sparkles, GraduationCap, User } from 'lucide-react';
import { signInWithGoogle } from '@/lib/user-auth';
import { toast } from '@/components/ui/toast';
import { UserRole } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: import('@/types').User) => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) setSelectedRole(null);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    if (!selectedRole) {
      toast({
        title: 'Role Required',
        description: 'Please select whether you are a Student or Professor.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      await signInWithGoogle(selectedRole);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to start sign-in. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <Card
        className="relative w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-0 rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-28 bg-gradient-to-br from-[#57068C] to-purple-600 flex items-center justify-center">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-4 left-8 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute bottom-4 right-12 w-24 h-24 rounded-full bg-white/10" />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full h-9 w-9 text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Sign in to NYU AI Study Buddy
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Use your NYU Google account to continue
            </p>
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              I am a <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedRole === 'student'
                    ? 'border-[#57068C] bg-purple-50 dark:bg-purple-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                }`}
              >
                <GraduationCap className={`h-6 w-6 mx-auto mb-2 ${selectedRole === 'student' ? 'text-[#57068C]' : 'text-gray-400'}`} />
                <p className={`text-sm font-medium ${selectedRole === 'student' ? 'text-[#57068C]' : 'text-gray-600 dark:text-gray-400'}`}>
                  Student
                </p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('professor')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedRole === 'professor'
                    ? 'border-[#57068C] bg-purple-50 dark:bg-purple-950/20'
                    : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                }`}
              >
                <User className={`h-6 w-6 mx-auto mb-2 ${selectedRole === 'professor' ? 'text-[#57068C]' : 'text-gray-400'}`} />
                <p className={`text-sm font-medium ${selectedRole === 'professor' ? 'text-[#57068C]' : 'text-gray-600 dark:text-gray-400'}`}>
                  Professor
                </p>
              </button>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <Button
            onClick={handleSignIn}
            disabled={loading || !selectedRole}
            className="w-full h-12 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirecting…
              </span>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            Only{' '}
            <span className="font-semibold text-[#57068C] dark:text-purple-400">@nyu.edu</span>{' '}
            accounts are allowed
          </p>
        </div>
      </Card>
    </div>
  );
}

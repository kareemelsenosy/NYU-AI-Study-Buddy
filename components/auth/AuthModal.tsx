"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X, Sparkles, GraduationCap, User, Eye, EyeOff } from 'lucide-react';
import { signIn, signUp } from '@/lib/user-auth';
import { toast } from '@/components/ui/toast';
import { UserRole } from '@/types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: import('@/types').User) => void;
}

export function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTab('signin');
      setSelectedRole(null);
      setName('');
      setEmail('');
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.success && result.user) {
        toast({ title: 'Welcome back!', description: `Signed in as ${result.user.name}`, variant: 'success' });
        onAuthSuccess(result.user);
        onClose();
      } else {
        toast({ title: 'Sign in failed', description: result.error || 'Invalid email or password.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !selectedRole) {
      toast({ title: 'Missing fields', description: 'Please fill in all fields and select a role.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const result = await signUp(name.trim(), email.trim(), password, selectedRole);
      if (result.success && result.user) {
        toast({ title: 'Account created!', description: `Welcome, ${result.user.name}!`, variant: 'success' });
        onAuthSuccess(result.user);
        onClose();
      } else {
        toast({ title: 'Sign up failed', description: result.error || 'Could not create account.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
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
              NYU AI Study Buddy
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in or create an account to continue
            </p>
          </div>

          {/* Tab Switch */}
          <div className="flex rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setTab('signin')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'signin'
                  ? 'bg-[#57068C] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === 'signup'
                  ? 'bg-[#57068C] text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Sign In Form */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@nyu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full h-11 rounded-xl bg-[#57068C] hover:bg-[#6A0BA8] text-white font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : 'Sign In'}
              </Button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => setTab('signup')} className="text-[#57068C] dark:text-purple-400 font-medium hover:underline">
                  Create one
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Form */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Full Name
                </label>
                <Input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@nyu.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Password{' '}
                  <span className="text-gray-400 font-normal">(min 6 characters)</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedRole === 'student'
                        ? 'border-[#57068C] bg-purple-50 dark:bg-purple-950/20'
                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                    }`}
                  >
                    <GraduationCap className={`h-5 w-5 mx-auto mb-1.5 ${selectedRole === 'student' ? 'text-[#57068C]' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${selectedRole === 'student' ? 'text-[#57068C]' : 'text-gray-600 dark:text-gray-400'}`}>
                      Student
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('professor')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedRole === 'professor'
                        ? 'border-[#57068C] bg-purple-50 dark:bg-purple-950/20'
                        : 'border-gray-200 dark:border-gray-800 hover:border-purple-300'
                    }`}
                  >
                    <User className={`h-5 w-5 mx-auto mb-1.5 ${selectedRole === 'professor' ? 'text-[#57068C]' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${selectedRole === 'professor' ? 'text-[#57068C]' : 'text-gray-600 dark:text-gray-400'}`}>
                      Professor
                    </p>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !name.trim() || !email.trim() || !password || !selectedRole}
                className="w-full h-11 rounded-xl bg-[#57068C] hover:bg-[#6A0BA8] text-white font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating account…
                  </span>
                ) : 'Create Account'}
              </Button>
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                Already have an account?{' '}
                <button type="button" onClick={() => setTab('signin')} className="text-[#57068C] dark:text-purple-400 font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

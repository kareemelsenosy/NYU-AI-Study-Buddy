"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const handle = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session) {
        setError('Authentication failed. Please try again.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      const email = session.user.email || '';
      if (!email.endsWith('@nyu.edu')) {
        await supabase.auth.signOut();
        setError('Only @nyu.edu email addresses are allowed.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      const role = sessionStorage.getItem('pending-role') || 'student';
      sessionStorage.removeItem('pending-role');

      const response = await fetch('/api/auth/oauth-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: session.access_token, role }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Failed to complete sign-in. Please try again.');
        setTimeout(() => router.push('/'), 3000);
        return;
      }

      const { user } = await response.json();
      localStorage.setItem('nyu-study-buddy-user', JSON.stringify(user));
      localStorage.setItem('nyu-study-buddy-user-role', user.role);
      router.push('/');
    };

    handle();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-5xl">❌</div>
            <h1 className="text-xl font-bold text-red-600">{error}</h1>
            <p className="text-gray-500 text-sm">Redirecting back…</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 border-4 border-[#57068C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-600 dark:text-gray-400">Completing sign-in…</p>
          </>
        )}
      </div>
    </div>
  );
}

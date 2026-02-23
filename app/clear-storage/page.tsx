"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ClearStoragePage() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    localStorage.clear();
    setDone(true);
    setTimeout(() => router.push("/"), 2000);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-950">
      <div className="text-center space-y-4">
        {done ? (
          <>
            <div className="text-5xl">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Local storage cleared!
            </h1>
            <p className="text-gray-500">Redirecting you to the home page…</p>
          </>
        ) : (
          <p className="text-gray-500">Clearing…</p>
        )}
      </div>
    </div>
  );
}

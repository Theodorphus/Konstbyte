"use client";

import React, { useState, useTransition } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) return;
    startTransition(() => {
      signIn('email', { email, callbackUrl: '/' });
    });
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-semibold">Logga in</h1>
      <p className="text-slate-600 mt-2">
        Ange din e‑post för att få en magisk länk.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm">E‑post</span>
          <Input
            name="email"
            type="email"
            required
            className="mt-1"
            placeholder="du@exempel.se"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <Button
          type="submit"
          disabled={isPending}
          className="w-full bg-slate-900 text-white shadow-md transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
        >
          Skicka länk
        </Button>
      </form>
      <div className="mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-slate-200" />
          <div className="text-sm text-slate-500">eller</div>
          <div className="flex-1 h-px bg-slate-200" />
        </div>
        <Button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full border border-slate-200 bg-white text-slate-900 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-slate-50"
        >
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white">
            <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.1 1.5 7.5 2.8l5.1-5.1C33.4 4.2 29.1 2 24 2 14.6 2 6.6 7.4 3 15.2l6 4.7C11 13.8 17 9.5 24 9.5z" />
              <path fill="#34A853" d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v7.7h12.7c-.3 2-1.7 5-4.8 7l7.4 5.7c4.3-4 7.2-9.9 7.2-16.3z" />
              <path fill="#4A90E2" d="M9 28.6c-1-2-1-4.2 0-6.2l-6-4.7c-2.6 5.2-2.6 11.3 0 16.5l6-4.6z" />
              <path fill="#FBBC05" d="M24 46c5.1 0 9.4-1.7 12.5-4.6l-7.4-5.7c-2 1.4-4.7 2.3-5.1 2.3-7 0-13-4.3-15-10.4l-6 4.6C6.6 40.6 14.6 46 24 46z" />
            </svg>
          </span>
          Fortsätt med Google
        </Button>
      </div>
    </div>
  );
}

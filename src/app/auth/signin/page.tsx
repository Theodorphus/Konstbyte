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
          className="w-full"
        >
          Skicka länk
        </Button>
      </form>
    </div>
  );
}

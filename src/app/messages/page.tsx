'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just nu';
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h sedan`;
  return `${Math.floor(diff / 86400)} d sedan`;
}

interface OtherUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Conversation {
  other: OtherUser;
  lastMessage: { content: string; createdAt: string; senderId: string };
  unread: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/messages')
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Meddelanden</h1>
        <p className="text-sm text-slate-500">Dina konversationer med konstnärer och köpare</p>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400 animate-pulse">
          Laddar…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50/80 p-8 text-center text-sm text-red-700 font-medium">
          Kunde inte ladda meddelanden. Försök ladda om sidan.
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-10 text-center space-y-2">
          <p className="text-2xl">💬</p>
          <p className="font-medium text-slate-700">Inga konversationer ännu</p>
          <p className="text-sm text-slate-400">Ställ en fråga till en konstnär via deras profil eller konstverkssida.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          {conversations.map(({ other, lastMessage, unread }) => {
            const initial = (other.name || other.email)[0].toUpperCase();
            return (
              <Link
                key={other.id}
                href={`/messages/${other.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                  {other.image ? (
                    <img src={other.image} alt={initial} className="w-full h-full object-cover rounded-full" />
                  ) : initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`font-semibold text-sm truncate ${unread > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                      {other.name || other.email}
                    </span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {timeAgo(lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className={`text-sm truncate mt-0.5 ${unread > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                    {lastMessage.content}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center flex-shrink-0">
                    {unread}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

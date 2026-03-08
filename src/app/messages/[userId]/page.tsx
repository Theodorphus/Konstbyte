'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'just nu';
  if (diff < 3600) return `${Math.floor(diff / 60)} min sedan`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h sedan`;
  return `${Math.floor(diff / 86400)} d sedan`;
}

interface MsgUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  sender: MsgUser;
}

export default function ConversationPage() {
  const params = useParams();
  const userId = params.userId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [other, setOther] = useState<MsgUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/me')
      .then((r) => r.json())
      .then((d) => setCurrentUserId(d?.user?.id || null));

    fetch(`/api/users/${userId}`)
      .then((r) => r.json())
      .then(setOther);

    loadMessages();
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await fetch(`/api/messages/${userId}`);
      if (res.ok) setMessages(await res.json());
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/messages/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setText('');
      }
    } finally {
      setIsSending(false);
    }
  };

  const otherInitial = other ? (other.name || other.email)[0].toUpperCase() : '?';

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
        <Link href="/messages" className="text-slate-400 hover:text-slate-700 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>
        {other && (
          <>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
              {other.image ? (
                <img src={other.image} alt={otherInitial} className="w-full h-full object-cover" />
              ) : otherInitial}
            </div>
            <div>
              <Link href={`/users/${other.id}`} className="font-semibold text-slate-900 hover:underline text-sm">
                {other.name || other.email}
              </Link>
              <p className="text-xs text-slate-400">Konstnär på Konstbyte</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {isLoading ? (
          <p className="text-center text-sm text-slate-400 py-8">Laddar meddelanden…</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">
            Inga meddelanden ännu. Skicka det första!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.senderId === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-slate-900 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-slate-400 px-1">
                    {timeAgo(msg.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="flex gap-2 pt-4 border-t border-slate-100 mt-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Skriv ett meddelande…"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isSending || !text.trim()}
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-slate-900 text-white hover:bg-slate-700 transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
          </svg>
        </button>
      </form>
    </div>
  );
}

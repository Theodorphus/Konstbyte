"use client";

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { signOut, useSession } from "next-auth/react";

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  const { data: session, status } = useSession();

  useEffect(() => {
    if (!session) return;

    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/count');
        if (!res.ok) return;
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch {
        // Fail silently — notifications are non-critical
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setMobileMenuMounted(false);
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const triggerButton = mobileMenuButtonRef.current;
    document.body.style.overflow = 'hidden';

    const firstFocusable = mobileMenuRef.current?.querySelector<HTMLElement>('a, button');
    firstFocusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }

      if (event.key === 'Tab' && mobileMenuRef.current) {
        const focusableElements = Array.from(
          mobileMenuRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
        );

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        const activeElement = document.activeElement as HTMLElement | null;

        if (event.shiftKey) {
          if (activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      triggerButton?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <nav aria-label="Huvudnavigering" className="relative sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" aria-label="Startsida - Konstbyte" className="font-display text-lg font-semibold tracking-wide text-slate-900 hover:text-slate-700 transition-colors">
            🎨 Konstbyte
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/artworks" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150">
              Marknadsplats
            </Link>
            <Link href="/community" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150">
              Community
            </Link>
            <Link href="/utmaning" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150">
              Utmaning
            </Link>
            <Link href="/ai" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors duration-150">
              AI-verktyg
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {session ? (
              <>
                <Link
                  href="/messages"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Meddelanden
                </Link>
                <Link href="/notifications" className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-slate-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <Button variant="outline" size="sm" asChild className="border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900">
                  <Link href="/profile">Profil</Link>
                </Button>
                <Button size="sm" asChild className="bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm shadow-amber-200/50">
                  <Link href="/artworks/new">Lägg upp konst</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Logga ut
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900"
                  asChild
                >
                  <Link href="/auth/signin">Logga in</Link>
                </Button>
                <Button
                  size="sm"
                  className="bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-sm shadow-amber-200/50"
                  asChild
                >
                  <Link href="/artworks/new">Bli konstnär</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Stäng mobilmeny' : 'Öppna mobilmeny'}
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileMenuMounted && (
          <button
            type="button"
            aria-label="Stäng mobilmeny"
            onClick={() => setMobileMenuOpen(false)}
            className={`md:hidden fixed inset-0 top-16 bg-slate-900/20 backdrop-blur-[1px] transition-opacity duration-200 ${
              mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          />
        )}

        {/* Mobile menu */}
        {mobileMenuMounted && (
          <div
            ref={mobileMenuRef}
            id="mobile-menu"
            role="menu"
            className={`md:hidden relative z-10 border-t border-slate-200/70 py-4 space-y-3 bg-white/90 backdrop-blur-lg transition-all duration-200 ${
              mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
            }`}
          >
            <Link
              href="/artworks"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marknadsplats
            </Link>
            <Link
              href="/community"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link
              href="/utmaning"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Utmaning
            </Link>
            <Link
              href="/ai"
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI-verktyg
            </Link>
            {session && (
              <>
                <Link
                  href="/messages"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Meddelanden
                </Link>
                <Link
                  href="/notifications"
                  className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded-lg relative transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Notifikationer
                  {unreadCount > 0 && (
                    <span className="ml-2 bg-amber-200 text-slate-900 text-xs font-bold rounded-full px-2 py-0.5">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            <div className="border-t border-slate-200/70 pt-3 px-4 space-y-2">
              {session ? (
                <>
                  <Button variant="outline" className="w-full border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white" asChild>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      Profil
                    </Link>
                  </Button>
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" asChild>
                    <Link href="/artworks/new" onClick={() => setMobileMenuOpen(false)}>
                      Lägg upp konst
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-red-500 hover:text-white"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                  >
                    Logga ut
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/auth/signin">Logga in</Link>
                  </Button>
                  <Button
                    className="w-full bg-amber-400 text-slate-950 hover:bg-amber-300"
                    asChild
                  >
                    <Link href="/artworks/new" onClick={() => setMobileMenuOpen(false)}>
                      Bli konstnär
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}


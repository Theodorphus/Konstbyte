"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch unread notification count
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifications/count');
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error('Failed to fetch notification count:', error);
      }
    };

    fetchCount();
    
    // Poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <nav aria-label="Huvudnavigering" className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/70 backdrop-blur-lg shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" aria-label="Startsida - Konstbyte" className="font-display text-lg font-semibold tracking-wide text-slate-900 hover:text-slate-700 transition-colors">
            🎨 Konstbyte
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/feed" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Flöde
            </Link>
            <Link href="/artworks" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Marknadsplats
            </Link>
            <Link href="/users" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Sök användare
            </Link>
            <Link href="/favorites" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              Favoriter
            </Link>
            <Link href="/community" className="text-sm font-semibold text-slate-900 hover:text-slate-900 transition-colors rounded-full border border-slate-200/70 px-3 py-1.5 bg-white/60 hover:bg-white">
              Gå med i communityt
            </Link>
            <Link href="/ai" className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
              AI-verktyg
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/notifications" className="relative p-2 text-slate-700 hover:text-slate-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-200 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Button variant="outline" size="sm" asChild className="border-slate-300 text-slate-700 hover:bg-slate-900 hover:text-white">
              <Link href="/profile">Profil</Link>
            </Button>
            <Button size="sm" asChild className="bg-slate-900 text-white hover:bg-slate-800 shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300/70">
              <Link href="/artworks/new">Lägg upp konst</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
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

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div id="mobile-menu" role="menu" className="md:hidden border-t border-slate-200/70 py-4 space-y-3 bg-white/90 backdrop-blur-lg">
            <Link 
              href="/feed" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Flöde
            </Link>
            <Link 
              href="/artworks" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marknadsplats
            </Link>
            <Link 
              href="/users" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sök användare
            </Link>
            <Link 
              href="/favorites" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Favoriter
            </Link>
            <Link 
              href="/community" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link 
              href="/ai" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI-verktyg
            </Link>
            <Link 
              href="/notifications" 
              className="block px-4 py-2 text-slate-700 hover:bg-slate-900/5 hover:text-slate-900 rounded relative transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Notifikationer
              {unreadCount > 0 && (
                <span className="ml-2 bg-amber-200 text-slate-900 text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="border-t border-slate-200/70 pt-3 px-4 space-y-2">
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
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

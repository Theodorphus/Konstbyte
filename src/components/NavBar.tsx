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
    <nav aria-label="Huvudnavigering" className="border-b bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" aria-label="Startsida - Konstbyte" className="text-xl font-bold text-white hover:text-orange-100 transition-colors">
            🎨 Konstbyte
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/feed" className="text-sm text-white/90 hover:text-white transition-colors font-medium">
              Flöde
            </Link>
            <Link href="/artworks" className="text-sm text-white/90 hover:text-white transition-colors font-medium">
              Marknadsplats
            </Link>
            <Link href="/users" className="text-sm text-white/90 hover:text-white transition-colors font-medium">
              Sök användare
            </Link>
            <Link href="/favorites" className="text-sm text-white/90 hover:text-white transition-colors font-medium">
              Favoriter
            </Link>
            <Link href="/community" className="text-sm text-white/90 hover:text-white transition-colors font-medium">
              Community
            </Link>
            <Link href="/ai" className="text-sm text-white/90 hover:text-white transition-colors font-medium">
              AI-verktyg
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/notifications" className="relative p-2 text-white/90 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Button variant="outline" size="sm" asChild className="text-white hover:bg-white/20 hover:text-white">
              <Link href="/profile">Profil</Link>
            </Button>
            <Button size="sm" asChild className="bg-slate-900 text-white hover:bg-slate-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/60">
              <Link href="/artworks/new">Lägg upp konst</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-controls="mobile-menu"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Stäng mobilmeny' : 'Öppna mobilmeny'}
            className="md:hidden p-2 text-white hover:text-orange-100 transition-colors"
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
          <div id="mobile-menu" role="menu" className="md:hidden border-t border-white/20 py-4 space-y-3 bg-gradient-to-b from-transparent to-white/10">
            <Link 
              href="/feed" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Flöde
            </Link>
            <Link 
              href="/artworks" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Marknadsplats
            </Link>
            <Link 
              href="/users" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sök användare
            </Link>
            <Link 
              href="/favorites" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Favoriter
            </Link>
            <Link 
              href="/community" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Community
            </Link>
            <Link 
              href="/ai" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              AI-verktyg
            </Link>
            <Link 
              href="/notifications" 
              className="block px-4 py-2 text-white/90 hover:bg-white/20 hover:text-white rounded relative transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Notifikationer
              {unreadCount > 0 && (
                <span className="ml-2 bg-yellow-400 text-slate-900 text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>
            <div className="border-t border-white/20 pt-3 px-4 space-y-2">
              <Button variant="outline" className="w-full border-white text-white hover:bg-white/20" asChild>
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

"use client";

import { SessionProvider } from "next-auth/react";
import NavBar from "../components/NavBar";
import CookieBanner from "../components/CookieBanner";
import MissingNameBanner from "../components/MissingNameBanner";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NavBar />
      <MissingNameBanner />
      {children}
      <CookieBanner />
    </SessionProvider>
  );
}

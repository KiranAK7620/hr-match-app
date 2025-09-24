"use client";

import React from "react";
import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/75 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-base font-semibold tracking-tight text-foreground">
            HR Match
          </Link>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-muted-fg">
            <Link href="/jobs" className="hover:text-foreground transition-colors">Jobs</Link>
            <Link href="/candidate" className="hover:text-foreground transition-colors">Candidates</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {!session ? (
            <>
              <Link href="/signup" className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm">
                Sign up
              </Link>
              <Link href="/login" className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm">
                Log in
              </Link>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 pr-1">
                <span className="px-2 py-1 rounded-full bg-muted text-muted-fg text-xs">
                  {session.user?.email}
                </span>
                <span className="px-2 py-1 rounded-full bg-muted text-muted-fg text-xs">
                  {(session.user as any)?.role}
                </span>
              </div>
              <button onClick={() => signOut()} className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted transition-colors text-sm">
                Sign out
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

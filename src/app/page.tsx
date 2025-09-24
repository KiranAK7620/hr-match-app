"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-10 sm:p-16">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-muted rounded-full blur-3xl opacity-50" />
        </div>
        <div className="relative">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">AI-Powered HR Match & Recommendation</h1>
          <p className="mt-3 text-muted-fg max-w-2xl">
            Smartly connect candidates and jobs using AI-driven matching and personalized recommendations.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {!session ? (
              <>
                <Link href="/signup" className="px-4 py-2 rounded-md border border-border bg-foreground text-background hover:opacity-90 transition">
                  Get started
                </Link>
                <Link href="/login" className="px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-muted transition">
                  Log in
                </Link>
              </>
            ) : (
              <>
                {(session.user as any)?.role === "CANDIDATE" && (
                  <>
                    <Link href="/candidate" className="px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-muted transition">
                      Candidate Profile
                    </Link>
                    <Link href="/candidate" className="px-4 py-2 rounded-md border border-border bg-foreground text-background hover:opacity-90 transition">
                      Find Jobs
                    </Link>
                  </>
                )}
                {(session.user as any)?.role === "HR" && (
                  <Link href="/hr/jobs" className="px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-muted transition">
                    Manage Jobs
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI-Powered HR Match & Recommendation</h1>
        <div className="space-x-2">
          {!session ? (
            <>
              <Link href="/signup" className="px-3 py-1.5 rounded border">
                Sign up
              </Link>
              <Link href="/login" className="px-3 py-1.5 rounded border">
                Log in
              </Link>
            </>
          ) : (
            <button onClick={() => signOut()} className="px-3 py-1.5 rounded border">
              Sign out
            </button>
          )}
        </div>
      </header>

      {!session && (
        <p className="text-gray-600">Please sign up or log in to continue.</p>
      )}

      {session && (
        <div className="space-y-3">
          <p className="text-gray-700">
            Logged in as <span className="font-medium">{session.user?.email}</span> with role
            <span className="font-medium"> {(session.user as any)?.role}</span>
          </p>
          {((session.user as any)?.role === "CANDIDATE") && (
            <div className="space-x-2">
              <Link href="/candidate" className="px-3 py-1.5 rounded border">
                Candidate Profile
              </Link>
              <form action="/api/recommend/jobs" method="post" className="inline">
                <button className="px-3 py-1.5 rounded border">Find Jobs</button>
              </form>
            </div>
          )}
          {((session.user as any)?.role === "HR") && (
            <div className="space-x-2">
              <Link href="/hr/jobs" className="px-3 py-1.5 rounded border">
                HR Jobs
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

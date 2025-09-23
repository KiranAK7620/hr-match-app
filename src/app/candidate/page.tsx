"use client"

import { useEffect, useState } from 'react'

type Candidate = {
  userId: string
  skills: string[]
  experience: number
  preferences: Record<string, any>
  resumeUrl?: string | null
}

export default function CandidatePage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/candidates')
      if (res.status === 404) {
        setCandidate({ userId: '', skills: [], experience: 0, preferences: {} })
        return
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch profile')
      setCandidate(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        skills: String(formData.get('skills') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(formData.get('experience') || 0),
        preferences: {},
        resumeUrl: String(formData.get('resumeUrl') || '') || undefined,
      }
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setCandidate(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Candidate Profile</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <form action={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Skills (comma separated)</label>
          <input
            name="skills"
            defaultValue={candidate?.skills?.join(', ') || ''}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Experience (years)</label>
          <input
            name="experience"
            type="number"
            defaultValue={candidate?.experience ?? 0}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Resume URL (optional)</label>
          <input name="resumeUrl" defaultValue={candidate?.resumeUrl ?? ''} className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        <button disabled={loading} className="bg-black text-white rounded px-3 py-2">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <form action="/api/recommend/jobs" method="post">
        <button className="border rounded px-3 py-2">Find Job Recommendations</button>
      </form>
    </div>
  )
}

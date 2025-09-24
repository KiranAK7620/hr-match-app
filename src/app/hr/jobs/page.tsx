"use client"

import { useEffect, useState } from 'react'
import type { CandidatesRecommendation } from '@/lib/recommendationSchemas'

type Job = {
  id: string
  title: string
  description: string
  requiredSkills: string[]
  location?: string | null
  experience?: number | null
  salaryRange?: string | null
  createdAt: string
}

export default function HRJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recs, setRecs] = useState<Record<string, CandidatesRecommendation['items']>>({})

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/jobs')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load jobs')
      setJobs(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function onCreate(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        title: String(formData.get('title') || ''),
        description: String(formData.get('description') || ''),
        requiredSkills: String(formData.get('requiredSkills') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        location: String(formData.get('location') || '') || undefined,
        experience: formData.get('experience') ? Number(formData.get('experience')) : undefined,
        salaryRange: String(formData.get('salaryRange') || '') || undefined,
      }
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create job')
      await load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function onRecommend(jobId: string) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/recommend/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Recommendation failed')
      setRecs((prev) => ({ ...prev, [jobId]: json.items }))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function onCopy(text: string) {
    try {
      navigator.clipboard.writeText(text)
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-foreground">HR Jobs</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-muted-fg">Loading...</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Job</h2>
        <form action={onCreate} className="grid gap-3 md:grid-cols-2">
          <input name="title" placeholder="Title" className="border border-border bg-card text-foreground rounded px-3 py-2 md:col-span-1" required />
          <input name="location" placeholder="Location (optional)" className="border border-border bg-card text-foreground rounded px-3 py-2 md:col-span-1" />
          <input name="requiredSkills" placeholder="Required skills (comma separated)" className="border border-border bg-card text-foreground rounded px-3 py-2 md:col-span-2" required />
          <input name="experience" type="number" placeholder="Experience (optional)" className="border border-border bg-card text-foreground rounded px-3 py-2" />
          <input name="salaryRange" placeholder="Salary range (optional)" className="border border-border bg-card text-foreground rounded px-3 py-2" />
          <textarea name="description" placeholder="Description" className="border border-border bg-card text-foreground rounded px-3 py-2 md:col-span-2" rows={4} required />
          <button disabled={loading} className="rounded px-3 py-2 md:col-span-2 border border-border bg-foreground text-background disabled:opacity-60">Create</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your Jobs</h2>
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="border border-border rounded p-3 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-muted-fg">Skills: {j.requiredSkills.join(', ')}</p>
                </div>
                <button onClick={() => onRecommend(j.id)} className="px-3 py-1.5 rounded-md border border-border bg-background hover:bg-muted">Find Candidates</button>
              </div>

              {recs[j.id] && (
                <div className="mt-4 grid gap-3">
                  <h3 className="text-sm font-semibold text-muted-fg">Recommended Candidates</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {recs[j.id]!.map((it) => (
                      <div key={`${it.candidateId ?? it.name}-${it.rank}`} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">
                              #{it.rank} · {it.name ?? 'Candidate'}
                            </p>
                            <p className="text-xs text-muted-fg">Score: {(it.score * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-foreground/90 line-clamp-4">{it.rationale}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <button onClick={() => onCopy(it.rationale)} className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted text-sm">Copy rationale</button>
                          <button className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-muted text-sm">Shortlist</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

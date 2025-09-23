"use client"

import { useEffect, useState } from 'react'

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
      alert('Recommendation ready in console. Check Network tab for response.')
      console.log('AI Recommendation (candidates):', json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">HR Jobs</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Job</h2>
        <form action={onCreate} className="grid gap-3 md:grid-cols-2">
          <input name="title" placeholder="Title" className="border rounded px-3 py-2 md:col-span-1" required />
          <input name="location" placeholder="Location (optional)" className="border rounded px-3 py-2 md:col-span-1" />
          <input name="requiredSkills" placeholder="Required skills (comma separated)" className="border rounded px-3 py-2 md:col-span-2" required />
          <input name="experience" type="number" placeholder="Experience (optional)" className="border rounded px-3 py-2" />
          <input name="salaryRange" placeholder="Salary range (optional)" className="border rounded px-3 py-2" />
          <textarea name="description" placeholder="Description" className="border rounded px-3 py-2 md:col-span-2" rows={4} required />
          <button disabled={loading} className="bg-black text-white rounded px-3 py-2 md:col-span-2">Create</button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Your Jobs</h2>
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-sm text-gray-600">Skills: {j.requiredSkills.join(', ')}</p>
                </div>
                <button onClick={() => onRecommend(j.id)} className="px-3 py-1.5 rounded border">Find Candidates</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

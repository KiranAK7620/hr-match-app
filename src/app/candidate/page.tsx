"use client"

import { useEffect, useState } from 'react'

type Candidate = {
  userId: string
  skills: string[]
  experience: number
  preferences: Record<string, any>
  resumeUrl?: string | null
}

type JobRecommendationItem = {
  rank: number
  jobId?: string
  title?: string
  score: number
  rationale: string
}

export default function CandidatePage() {
  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [recsLoading, setRecsLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<JobRecommendationItem[] | null>(null)
  // Local controlled form state
  const [skillsStr, setSkillsStr] = useState('')
  const [experienceYears, setExperienceYears] = useState<number>(0)
  const [resumeUrl, setResumeUrl] = useState('')

  async function load() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/candidates')
      if (res.status === 404) {
        const fallback = { userId: '', skills: [], experience: 0, preferences: {} } as Candidate
        setCandidate(fallback)
        // Initialize form state for new profile
        setSkillsStr('')
        setExperienceYears(0)
        setResumeUrl('')
        return
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to fetch profile')
      setCandidate(json)
      // Initialize form state from loaded profile
      setSkillsStr(Array.isArray(json.skills) ? json.skills.join(', ') : '')
      setExperienceYears(typeof json.experience === 'number' ? json.experience : 0)
      setResumeUrl(json.resumeUrl ?? '')
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
        // Use controlled state to avoid stale defaultValue issues
        skills: String(skillsStr || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(experienceYears || 0),
        preferences: {},
        resumeUrl: String(resumeUrl || '') || undefined,
      }
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to save')
      setCandidate(json)
      // Sync controlled inputs with saved profile
      setSkillsStr(Array.isArray(json.skills) ? json.skills.join(', ') : '')
      setExperienceYears(typeof json.experience === 'number' ? json.experience : 0)
      setResumeUrl(json.resumeUrl ?? '')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecommendations() {
    setError(null)
    setRecsLoading(true)
    setRecommendations(null)
    try {
      const res = await fetch('/api/recommend/jobs', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to get recommendations')
      setRecommendations(json.items as JobRecommendationItem[])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRecsLoading(false)
    }
  }

  function onApply(jobId?: string) {
    // Placeholder: wire up real apply flow or navigation when available
    if (!jobId) {
      alert('Apply flow coming soon.')
      return
    }
    alert(`Applied to job ${jobId}! (demo)`) // Replace with real API/action later
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Candidate Profile</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <form action={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Skills (comma separated)</label>
          <input
            name="skills"
            value={skillsStr}
            onChange={(e) => setSkillsStr(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Experience (years)</label>
          <input
            name="experience"
            type="number"
            value={experienceYears}
            onChange={(e) => setExperienceYears(Number(e.target.value))}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Resume URL (optional)</label>
          <input
            name="resumeUrl"
            value={resumeUrl}
            onChange={(e) => setResumeUrl(e.target.value)}
            className="mt-1 w-full border rounded px-3 py-2"
          />
        </div>
        <button disabled={loading} className="bg-black text-white rounded px-3 py-2">
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <button onClick={fetchRecommendations} className="border rounded px-3 py-2">
          {recsLoading ? 'Finding recommendations...' : 'Find Job Recommendations'}
        </button>
      </div>

      {recommendations && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Recommended Jobs</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {recommendations.map((item) => (
              <div key={`${item.jobId}-${item.rank}`} className="border rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-medium">{item.title || 'Job'}</h3>
                    <p className="text-sm text-gray-600">Rank #{item.rank}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">Score: {(item.score * 100).toFixed(0)}%</div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{item.rationale}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => onApply(item.jobId)}
                    className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
                  >
                    Apply
                  </button>
                  {item.jobId && (
                    <a
                      href={`/jobs/${item.jobId}`}
                      className="border rounded px-3 py-2 text-sm"
                      title="View details"
                    >
                      View Details
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

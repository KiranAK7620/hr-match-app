"use client"

import { useState } from 'react'

export function ApplyButton({ jobId }: { jobId?: string }) {
  const [loading, setLoading] = useState(false)

  async function onApply() {
    if (!jobId) {
      alert('Apply flow coming soon')
      return
    }
    try {
      setLoading(true)
      // TODO: Wire up to a real applications endpoint
      // const res = await fetch('/api/applications', { method: 'POST', body: JSON.stringify({ jobId }) })
      // const json = await res.json()
      // if (!res.ok) throw new Error(json.error || 'Failed to apply')
      alert(`Applied to job ${jobId}! (demo)`)
    } catch (e: any) {
      alert(e.message || 'Failed to apply')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onApply}
      disabled={loading}
      className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700 disabled:opacity-60"
    >
      {loading ? 'Applying...' : 'Apply'}
    </button>
  )
}

"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    try {
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role'),
        company: formData.get('company') || undefined,
      }
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Signup failed')
      router.push('/login')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create an account</h1>
      <form action={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Name</label>
          <input name="name" className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input name="email" type="email" className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input name="password" type="password" className="mt-1 w-full border rounded px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select name="role" className="mt-1 w-full border rounded px-3 py-2" required>
            <option value="HR">HR</option>
            <option value="CANDIDATE">Candidate</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Company (HR only)</label>
          <input name="company" className="mt-1 w-full border rounded px-3 py-2" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="w-full bg-black text-white py-2 rounded">
          {loading ? 'Creating...' : 'Sign up'}
        </button>
      </form>
    </div>
  )
}

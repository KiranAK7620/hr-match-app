import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAI } from '@/lib/ai'
import { JobsRecommendationSchema } from '@/lib/recommendationSchemas'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'CANDIDATE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const candidate = await prisma.candidate.findUnique({ where: { userId: session.user.id } })
    if (!candidate) return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })

    const jobs = await prisma.job.findMany()

    const input = {
      candidate: {
        skills: candidate.skills,
        experience: candidate.experience,
        preferences: candidate.preferences,
      },
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        requiredSkills: j.requiredSkills,
        location: j.location,
        experience: j.experience,
      })),
    }

    const system = `You are an HR assistant. Rank the best jobs for the given candidate. Return strict JSON {"items":[{"rank":number,"jobId":string,"title":string,"score":number,"rationale":string}]}. Include top 3-5 only.`
    const userContent = `Candidate: ${JSON.stringify(input.candidate)}\nJobs: ${JSON.stringify(input.jobs)}\nRespond with JSON only.`

    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const cleaned = raw.replace(/^```json\n?|\n?```$/g, '')

    const parsed = JobsRecommendationSchema.safeParse(JSON.parse(cleaned))
    if (!parsed.success) {
      return NextResponse.json({ error: 'AI response invalid', details: parsed.error.flatten() }, { status: 502 })
    }

    await prisma.recommendation.create({
      data: {
        requestType: 'CANDIDATE_TO_JOBS',
        userId: session.user.id,
        query: JSON.stringify({ candidateId: candidate.id }),
        aiResponse: parsed.data,
      },
    })

    return NextResponse.json(parsed.data)
  } catch (err) {
    console.error('recommend/jobs error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

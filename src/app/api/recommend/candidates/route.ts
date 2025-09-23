import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAI } from '@/lib/ai'
import { CandidatesRecommendationSchema } from '@/lib/recommendationSchemas'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { jobId } = (await req.json()) as { jobId: string }
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    const candidates = await prisma.candidate.findMany({ include: { user: { select: { name: true } } } })

    const input = {
      job: {
        title: job.title,
        description: job.description,
        requiredSkills: job.requiredSkills,
        location: job.location,
        experience: job.experience,
      },
      candidates: candidates.map((c) => ({
        id: c.id,
        name: c.user?.name ?? 'Candidate',
        skills: c.skills,
        experience: c.experience,
        preferences: c.preferences,
      })),
    }

    const system = `You are an HR assistant. Rank the best candidates for the given job. Return strict JSON {"items":[{"rank":number,"candidateId":string,"name":string,"score":number,"rationale":string}]}. Include top 3-5 only.`
    const userContent = `Job: ${JSON.stringify(input.job)}\nCandidates: ${JSON.stringify(input.candidates)}\nRespond with JSON only.`

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

    const parsed = CandidatesRecommendationSchema.safeParse(JSON.parse(cleaned))
    if (!parsed.success) {
      return NextResponse.json({ error: 'AI response invalid', details: parsed.error.flatten() }, { status: 502 })
    }

    await prisma.recommendation.create({
      data: {
        requestType: 'HR_TO_CANDIDATES',
        userId: session.user.id,
        query: JSON.stringify({ jobId, job: input.job }),
        aiResponse: parsed.data,
      },
    })

    return NextResponse.json(parsed.data)
  } catch (err) {
    console.error('recommend/candidates error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

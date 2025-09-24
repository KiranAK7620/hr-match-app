import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAI, getAIConfig } from '@/lib/ai'
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

    const system = `You are an HR assistant. Rank the best candidates for the given job.
Return strict JSON with this shape only:
{"items":[{"rank":number,"candidateId":string,"name":string,"score":number,"rationale":string}]}.
- Include top 3-5 only.
- IMPORTANT: score MUST be a number between 0 and 1 (inclusive).`
    const userContent = `Job: ${JSON.stringify(input.job)}\nCandidates: ${JSON.stringify(input.candidates)}\nRespond with JSON only.`

    const openai = getOpenAI()
    const { model, temperature } = getAIConfig()
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
      temperature,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const cleaned = raw.replace(/^```json\n?|\n?```$/g, '')

    // Parse and normalize scores to [0,1] before schema validation
    const json = JSON.parse(cleaned)
    if (json && Array.isArray(json.items)) {
      json.items = json.items.map((item: any, idx: number) => {
        let score = item?.score
        if (typeof score === 'string') {
          const n = Number(score)
          score = Number.isFinite(n) ? n : score
        }
        if (typeof score === 'number') {
          if (score > 1 && score <= 100) score = score / 100
          if (score > 1) score = 1
          if (score < 0) score = 0
        }
        return { ...item, score, rank: item?.rank ?? idx + 1 }
      })
    }

    const parsed = CandidatesRecommendationSchema.safeParse(json)
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

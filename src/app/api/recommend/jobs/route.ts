import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getOpenAI, getAIConfig } from '@/lib/ai'
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

    const system = `You are an HR assistant. Rank the best jobs for the given candidate.
Return strict JSON with this shape only:
{"items":[{"rank":number,"jobId":string,"title":string,"score":number,"rationale":string}]}.
- Include top 3-5 only.
- IMPORTANT: score MUST be a number between 0 and 1 (inclusive).`
    const userContent = `Candidate: ${JSON.stringify(input.candidate)}\nJobs: ${JSON.stringify(input.jobs)}\nRespond with JSON only.`

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
    console.log('completion',completion);
    const raw = completion.choices[0]?.message?.content ?? '{}'
    console.log('raw',raw);
    const cleaned = raw.replace(/^```json\n?|\n?```$/g, '')
    console.log('cleaned',cleaned);
    
    // Parse and normalize scores to [0,1] before schema validation
    const json = JSON.parse(cleaned)
    console.log('json',json);
    if (json && Array.isArray(json.items)) {
      json.items = json.items.map((item: any, idx: number) => {
        let score = item?.score
        if (typeof score === 'string') {
          const n = Number(score)
          score = Number.isFinite(n) ? n : score
        }
        if (typeof score === 'number') {
          // If model returned 0-100, scale down. If above 1, clamp to 1. Ensure >=0
          if (score > 1 && score <= 100) score = score / 100
          if (score > 1) score = 1
          if (score < 0) score = 0
        }
        return { ...item, score, rank: item?.rank ?? idx + 1 }
      })
    }

    const parsed = JobsRecommendationSchema.safeParse(json)
    console.log('parsed',parsed);
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

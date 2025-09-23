import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { JobCreateSchema } from '@/lib/validation'

export async function GET() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    include: { hr: { select: { company: true } } },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'HR') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const json = await req.json()
  const parsed = JobCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const hr = await prisma.hR.findUnique({ where: { userId: session.user.id } })
  if (!hr) return NextResponse.json({ error: 'HR profile not found' }, { status: 404 })

  const job = await prisma.job.create({
    data: { hrId: hr.id, ...parsed.data },
  })
  return NextResponse.json(job, { status: 201 })
}

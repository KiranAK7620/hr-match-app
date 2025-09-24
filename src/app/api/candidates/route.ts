import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CandidateCreateSchema } from '@/lib/validation'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'CANDIDATE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const candidate = await prisma.candidate.findUnique({ where: { userId: session.user.id } })
  if (!candidate) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(candidate)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'CANDIDATE') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const json = await req.json()
  const parsed = CandidateCreateSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }
  const data = parsed.data

  const existing = await prisma.candidate.findUnique({ where: { userId: session.user.id } })
  const result = existing
    ? await prisma.candidate.update({ where: { userId: session.user.id }, data })
    : await prisma.candidate.create({ data: { ...data, userId: session.user.id } })

  return NextResponse.json(result, { status: existing ? 200 : 201 })
}

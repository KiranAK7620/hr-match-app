import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const SignupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['CANDIDATE', 'HR'], {
    errorMap: () => ({ message: 'Role must be CANDIDATE or HR' }),
  }),
  company: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const parsed = SignupSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, password, role, company } = parsed.data

    // Ensure email is unique
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
      },
    })

    // Optionally, if HR and company is provided, create a minimal HR profile
    if (role === 'HR' && company) {
      try {
        await prisma.hR.create({ data: { userId: user.id, company } })
      } catch {
        // If HR model or constraints differ, ignore optional profile creation
      }
    }

    return NextResponse.json({ id: user.id, email: user.email, role: user.role, name: user.name }, { status: 201 })
  } catch (err) {
    console.error('Signup error', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

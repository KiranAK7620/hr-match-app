import { z } from 'zod'

export const CandidateCreateSchema = z.object({
  skills: z.array(z.string()).default([]),
  experience: z.number().int().min(0).max(60).default(0),
  preferences: z.record(z.any()).default({}),
  resumeUrl: z.string().url().optional(),
})

export const JobCreateSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(10).max(5000),
  requiredSkills: z.array(z.string()).min(1),
  location: z.string().max(120).optional(),
  experience: z.number().int().min(0).max(60).optional(),
  salaryRange: z.string().max(120).optional(),
})

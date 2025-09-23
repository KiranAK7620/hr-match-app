import { z } from 'zod'

export const RankedCandidateSchema = z.object({
  rank: z.number().int().min(1),
  candidateId: z.string().optional(),
  name: z.string().optional(),
  score: z.number().min(0).max(1),
  rationale: z.string().min(1),
})

export const RankedJobSchema = z.object({
  rank: z.number().int().min(1),
  jobId: z.string().optional(),
  title: z.string().optional(),
  score: z.number().min(0).max(1),
  rationale: z.string().min(1),
})

export const CandidatesRecommendationSchema = z.object({
  items: z.array(RankedCandidateSchema).min(1),
})

export const JobsRecommendationSchema = z.object({
  items: z.array(RankedJobSchema).min(1),
})

export type CandidatesRecommendation = z.infer<typeof CandidatesRecommendationSchema>
export type JobsRecommendation = z.infer<typeof JobsRecommendationSchema>

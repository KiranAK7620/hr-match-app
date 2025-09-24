import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ApplyButton } from '@/components/ApplyButton'

export default async function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = await prisma.job.findUnique({
    where: { id: params.id },
    include: {
      hr: { select: { company: true } },
    },
  })

  if (!job) return notFound()

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-muted-fg text-sm">{job.hr?.company ?? 'Company'}</p>
        </div>
        <ApplyButton jobId={job.id} />
      </div>

      <div className="space-y-2">
        {job.location && (
          <p className="text-sm"><span className="font-medium">Location:</span> {job.location}</p>
        )}
        {typeof job.experience === 'number' && (
          <p className="text-sm"><span className="font-medium">Experience:</span> {job.experience} years</p>
        )}
        {job.salaryRange && (
          <p className="text-sm"><span className="font-medium">Salary Range:</span> {job.salaryRange}</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Required Skills</h2>
        {job.requiredSkills?.length ? (
          <ul className="list-disc list-inside text-sm text-foreground/90">
            {job.requiredSkills.map((s: string) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-fg">No skills listed.</p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Description</h2>
        <p className="whitespace-pre-line text-foreground/90 text-sm">{job.description}</p>
      </div>

      <div>
        <a href="/candidate" className="text-sm underline">Back to candidate</a>
      </div>
    </div>
  )
}

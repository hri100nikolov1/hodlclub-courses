import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import CertificatePrint from '@/components/CertificatePrint'

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      quiz: {
        include: {
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  title: true,
                  course: { select: { title: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!certificate) notFound()

  const issuedAt = certificate.issuedAt.toLocaleDateString('bg-BG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <CertificatePrint
      userName={certificate.user.name}
      lessonTitle={certificate.quiz.lesson.title}
      moduleTitle={certificate.quiz.lesson.module.title}
      courseTitle={certificate.quiz.lesson.module.course.title}
      issuedAt={issuedAt}
      certificateId={certificate.id}
    />
  )
}

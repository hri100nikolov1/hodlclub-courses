import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ error: 'Не сте влезли' }, { status: 401 })
    }

    const { moduleId } = await request.json()
    if (!moduleId) {
      return Response.json({ error: 'Невалидни данни' }, { status: 400 })
    }

    // Load the module with its lessons and their quizzes
    const moduleData = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        lessons: {
          include: { quiz: { select: { id: true } } },
        },
      },
    })

    if (!moduleData) {
      return Response.json({ error: 'Модулът не е намерен' }, { status: 404 })
    }

    // Collect all quizzes in this module
    const quizIds = moduleData.lessons
      .map((l) => l.quiz?.id)
      .filter((id): id is string => !!id)

    if (quizIds.length === 0) {
      return Response.json(
        { error: 'Този модул няма тестове' },
        { status: 400 }
      )
    }

    // Fetch the user's attempts for these quizzes
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: session.userId, quizId: { in: quizIds } },
      select: { quizId: true, score: true, total: true },
    })

    // Every quiz must have an attempt with a perfect score
    const perfectQuizIds = new Set(
      attempts.filter((a) => a.total > 0 && a.score === a.total).map((a) => a.quizId)
    )
    const allPerfect = quizIds.every((id) => perfectQuizIds.has(id))

    if (!allPerfect) {
      return Response.json(
        { error: 'Трябва да решите всички тестове от модула с максимален резултат' },
        { status: 403 }
      )
    }

    // Upsert certificate (one per user+module)
    const certificate = await prisma.certificate.upsert({
      where: { userId_moduleId: { userId: session.userId, moduleId } },
      create: { userId: session.userId, moduleId },
      update: {},
    })

    return Response.json({ ok: true, certificateId: certificate.id })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ error: 'Не сте влезли' }, { status: 401 })
    }

    const { quizId, answers, score, total } = await request.json()

    if (!quizId || !Array.isArray(answers) || score === undefined || !total) {
      return Response.json({ error: 'Невалидни данни' }, { status: 400 })
    }

    const attempt = await prisma.quizAttempt.upsert({
      where: { userId_quizId: { userId: session.userId, quizId } },
      create: { userId: session.userId, quizId, answers, score, total },
      update: { answers, score, total, completedAt: new Date() },
    })

    return Response.json({ ok: true, attemptId: attempt.id })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}

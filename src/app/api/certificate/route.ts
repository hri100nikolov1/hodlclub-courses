import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return Response.json({ error: 'Не сте влезли' }, { status: 401 })
    }

    const { quizId } = await request.json()
    if (!quizId) {
      return Response.json({ error: 'Невалидни данни' }, { status: 400 })
    }

    // Verify that the user actually got 100% on this quiz
    const attempt = await prisma.quizAttempt.findUnique({
      where: { userId_quizId: { userId: session.userId, quizId } },
    })

    if (!attempt) {
      return Response.json({ error: 'Не е намерен опит за теста' }, { status: 404 })
    }

    if (attempt.score !== attempt.total) {
      return Response.json({ error: 'Не сте постигнали 100% резултат' }, { status: 403 })
    }

    // Upsert certificate (one per user+quiz)
    const certificate = await prisma.certificate.upsert({
      where: { userId_quizId: { userId: session.userId, quizId } },
      create: { userId: session.userId, quizId },
      update: {},
    })

    return Response.json({ ok: true, certificateId: certificate.id })
  } catch (err) {
    console.error(err)
    return Response.json({ error: 'Сървърна грешка' }, { status: 500 })
  }
}

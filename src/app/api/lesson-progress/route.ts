import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await request.json()
  if (!lessonId) return Response.json({ error: 'lessonId required' }, { status: 400 })

  // Verify user has access to this lesson's course
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          lessons: { orderBy: { order: 'asc' }, select: { id: true } },
          course: { include: { userAccess: true } },
        },
      },
    },
  })

  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  const hasAccess =
    session.role === 'admin' ||
    lesson.module.course.userAccess.some((a) => a.userId === session.userId)

  if (!hasAccess) return Response.json({ error: 'No access' }, { status: 403 })

  // Mark lesson as complete
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: session.userId, lessonId } },
    create: { userId: session.userId, lessonId },
    update: { completedAt: new Date() },
  })

  // Check if all lessons in the module are now complete
  const moduleId = lesson.module.id
  const allLessonIds = lesson.module.lessons.map((l) => l.id)
  const completedCount = await prisma.lessonProgress.count({
    where: { userId: session.userId, lessonId: { in: allLessonIds } },
  })

  const allDone = completedCount === allLessonIds.length

  if (allDone) {
    // Auto-complete the module
    await prisma.moduleProgress.upsert({
      where: { userId_moduleId: { userId: session.userId, moduleId } },
      create: { userId: session.userId, moduleId },
      update: { completedAt: new Date() },
    })
  }

  return Response.json({ ok: true, moduleCompleted: allDone })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { lessonId } = await request.json()
  if (!lessonId) return Response.json({ error: 'lessonId required' }, { status: 400 })

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true },
  })

  if (!lesson) return Response.json({ error: 'Lesson not found' }, { status: 404 })

  // Unmark lesson
  await prisma.lessonProgress.deleteMany({
    where: { userId: session.userId, lessonId },
  })

  // Remove module completion (since not all lessons are done anymore)
  await prisma.moduleProgress.deleteMany({
    where: { userId: session.userId, moduleId: lesson.moduleId },
  })

  return Response.json({ ok: true })
}

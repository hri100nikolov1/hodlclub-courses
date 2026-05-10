import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseId } = await params

  // Check access
  const access = session.role === 'admin'
    ? true
    : !!(await prisma.userCourseAccess.findUnique({
        where: { userId_courseId: { userId: session.userId, courseId } },
      }))

  if (!access) return Response.json({ error: 'No access' }, { status: 403 })

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: { orderBy: { order: 'asc' } },
    },
  })

  if (!course) return Response.json({ error: 'Not found' }, { status: 404 })

  // Get user's progress
  const progress = await prisma.moduleProgress.findMany({
    where: { userId: session.userId },
    select: { moduleId: true, completedAt: true },
  })

  const completedIds = new Set(progress.map((p) => p.moduleId))

  // Add lock state to each module
  const modulesWithState = course.modules.map((mod, index) => {
    const isCompleted = completedIds.has(mod.id)
    const prevModule = index === 0 ? null : course.modules[index - 1]
    const isLocked = index > 0 && !completedIds.has(prevModule!.id)

    return { ...mod, isLocked, isCompleted }
  })

  return Response.json({ course: { ...course, modules: modulesWithState }, progress })
}

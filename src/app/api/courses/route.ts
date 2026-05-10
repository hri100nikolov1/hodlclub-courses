import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let courses

  if (session.role === 'admin') {
    courses = await prisma.course.findMany({
      include: { _count: { select: { modules: true, userAccess: true } } },
      orderBy: { createdAt: 'desc' },
    })
  } else {
    const access = await prisma.userCourseAccess.findMany({
      where: { userId: session.userId },
      include: {
        course: {
          include: { _count: { select: { modules: true } } },
        },
      },
    })
    courses = access.map((a) => a.course)
  }

  return Response.json({ courses })
}

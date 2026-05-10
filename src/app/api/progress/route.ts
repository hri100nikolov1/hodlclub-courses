import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await request.json()
  if (!moduleId) return Response.json({ error: 'moduleId required' }, { status: 400 })

  // Check user has access to the course this module belongs to
  const module = await prisma.module.findUnique({
    where: { id: moduleId },
    include: { course: { include: { userAccess: true } } },
  })

  if (!module) return Response.json({ error: 'Module not found' }, { status: 404 })

  const hasAccess = module.course.userAccess.some((a) => a.userId === session.userId)
  if (!hasAccess && session.role !== 'admin') {
    return Response.json({ error: 'No access' }, { status: 403 })
  }

  // Upsert progress
  const progress = await prisma.moduleProgress.upsert({
    where: { userId_moduleId: { userId: session.userId, moduleId } },
    create: { userId: session.userId, moduleId },
    update: { completedAt: new Date() },
  })

  return Response.json({ ok: true, progress })
}

export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { moduleId } = await request.json()
  if (!moduleId) return Response.json({ error: 'moduleId required' }, { status: 400 })

  await prisma.moduleProgress.deleteMany({
    where: { userId: session.userId, moduleId },
  })

  return Response.json({ ok: true })
}

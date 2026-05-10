import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      courseAccess: { include: { course: { select: { title: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ users })
}

// Grant or revoke course access
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, courseId, action } = await request.json()
  if (!userId || !courseId || !action) {
    return Response.json({ error: 'userId, courseId, action required' }, { status: 400 })
  }

  if (action === 'grant') {
    await prisma.userCourseAccess.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId },
      update: {},
    })
  } else if (action === 'revoke') {
    await prisma.userCourseAccess.deleteMany({ where: { userId, courseId } })
  }

  return Response.json({ ok: true })
}

// Delete user
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  await prisma.user.delete({ where: { id } })
  return Response.json({ ok: true })
}

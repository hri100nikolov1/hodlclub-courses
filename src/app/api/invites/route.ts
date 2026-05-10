import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Create invite token (admin only)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, expiresAt } = await request.json()
  if (!courseId) return Response.json({ error: 'courseId required' }, { status: 400 })

  const invite = await prisma.inviteToken.create({
    data: {
      courseId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return Response.json({ invite })
}

// List invite tokens (admin only)
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const courseId = searchParams.get('courseId')

  const invites = await prisma.inviteToken.findMany({
    where: courseId ? { courseId } : undefined,
    include: {
      course: { select: { title: true } },
      usedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json({ invites })
}

// Delete invite token (admin only)
export async function DELETE(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  await prisma.inviteToken.delete({ where: { id } })
  return Response.json({ ok: true })
}

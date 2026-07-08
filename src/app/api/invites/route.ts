import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Create invite token (admin only)
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { courseId, type, moduleLimit, expiresAt } = await request.json()
  const inviteType = type === 'book' || type === 'book_modules' ? type : 'course'

  if ((inviteType === 'course' || inviteType === 'book_modules') && !courseId) {
    return Response.json({ error: 'courseId required' }, { status: 400 })
  }
  if (inviteType === 'book_modules' && (!moduleLimit || moduleLimit < 1)) {
    return Response.json({ error: 'moduleLimit required' }, { status: 400 })
  }

  const invite = await prisma.inviteToken.create({
    data: {
      type: inviteType,
      courseId: inviteType === 'book' ? null : courseId,
      moduleLimit: inviteType === 'book_modules' ? moduleLimit : null,
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

// Update invite token (admin only) — only allowed while unused
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id, courseId, type, moduleLimit } = await request.json()
  if (!id) return Response.json({ error: 'id required' }, { status: 400 })

  const existing = await prisma.inviteToken.findUnique({ where: { id } })
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })
  if (existing.usedById) {
    return Response.json({ error: 'Инвайтът вече е използван и не може да се редактира' }, { status: 400 })
  }

  const inviteType = type === 'book' || type === 'book_modules' ? type : 'course'

  if ((inviteType === 'course' || inviteType === 'book_modules') && !courseId) {
    return Response.json({ error: 'courseId required' }, { status: 400 })
  }
  if (inviteType === 'book_modules' && (!moduleLimit || moduleLimit < 1)) {
    return Response.json({ error: 'moduleLimit required' }, { status: 400 })
  }

  const invite = await prisma.inviteToken.update({
    where: { id },
    data: {
      type: inviteType,
      courseId: inviteType === 'book' ? null : courseId,
      moduleLimit: inviteType === 'book_modules' ? moduleLimit : null,
    },
  })

  return Response.json({ invite })
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
